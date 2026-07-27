// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stores — conecta una tienda nueva para el cliente autenticado.
//
// El token de esa tienda (DASHBOARD_API_TOKEN, ver healzypp-clean) lo genera
// EL SISTEMA aquí, no lo escribe el cliente: solo se muestra una vez en la
// respuesta para que ConnectStoreForm lo enseñe y el cliente lo copie a su
// .env. Por eso este es el primer Route Handler de este repo en vez de un
// insert directo desde el navegador (patrón que sí sigue el resto de
// mutaciones, como ProductActiveToggle en la plantilla) — la generación
// del secreto tiene que pasar por Node crypto, server-side.
//
// client_id nunca viene del body: se resuelve aquí con getCurrentClient()
// a partir de la sesión, así que no hay que confiar en nada que mande el
// cliente para decidir a qué cuenta pertenece la tienda nueva (aunque
// tampoco sería explotable: client_insert_own_stores en
// database/saas-schema.sql lo habría rechazado igual).
// ─────────────────────────────────────────────────────────────────────────────

import { randomBytes } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient, getCurrentClient } from '@/lib/supabase/server'
import { isTrustedOrigin } from '@/lib/security/origin-check'
import { checkRateLimit } from '@/lib/rate-limit'
import { isHttpAllowedForHostname, validateHostnameForConnect } from '@/lib/ssrf-guard'
import { PLAN_INFO } from '@/lib/plans'

type ConnectStoreBody = {
  nombre?: unknown
  url_tienda?: unknown
}

// 8 tiendas nuevas por hora y por cliente — de sobra para el uso normal
// (conectar unas pocas tiendas es algo que se hace una vez, no un flujo
// repetitivo), y frena la creación rápida de muchas "tiendas" apuntando a
// hosts/puertos internos distintos para acelerar un escaneo SSRF (ver
// audit-saas-security.md §5/Fase 2). No es la defensa principal contra SSRF
// — esa es validateHostnameForConnect() de abajo y, sobre todo, el guard en
// cada fetch real (src/lib/store-api.ts) — esto es fricción adicional.
const CONNECT_STORE_MAX = 8
const CONNECT_STORE_WINDOW_MS = 60 * 60 * 1000

export async function POST(req: NextRequest) {
  // Ruta de estado autenticada por cookie de sesión, sin Server Action que
  // lo cubra automáticamente — mismo patrón que ya se corrigió en
  // healzypp-clean (src/lib/security/origin-check.ts), ver
  // audit-saas-security.md §4.2.
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 })
  }

  const client = await getCurrentClient()
  if (!client) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const rateLimit = checkRateLimit(`connect-store:${client.id}`, CONNECT_STORE_MAX, CONNECT_STORE_WINDOW_MS)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas tiendas conectadas en poco tiempo. Prueba de nuevo más tarde.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.max(0, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))) },
      }
    )
  }

  const supabase = await createClient()

  // Límite de tiendas por plan — antes de validar el resto del body, para no
  // gastar la comprobación de hostname/SSRF en una petición que de todas
  // formas se va a rechazar. maxStores === null (plan Ultra) se salta el
  // conteo por completo.
  const planInfo = PLAN_INFO[client.plan]
  if (planInfo.maxStores !== null) {
    const { count, error: countError } = await supabase
      .from('stores')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', client.id)

    if (countError) {
      return NextResponse.json({ error: 'No se pudo comprobar el límite de tiendas.' }, { status: 500 })
    }
    if ((count ?? 0) >= planInfo.maxStores) {
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${planInfo.maxStores} tiendas de tu plan ${planInfo.label}. Mejora tu plan para conectar más.`,
        },
        { status: 400 }
      )
    }
  }

  let body: ConnectStoreBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const { nombre, url_tienda: urlTiendaRaw } = body

  if (typeof nombre !== 'string' || !nombre.trim()) {
    return NextResponse.json({ error: 'Ponle un nombre a la tienda.' }, { status: 400 })
  }

  if (typeof urlTiendaRaw !== 'string') {
    return NextResponse.json({ error: 'La URL de la tienda no es válida.' }, { status: 400 })
  }

  let urlTienda: URL
  try {
    urlTienda = new URL(urlTiendaRaw)
  } catch {
    return NextResponse.json(
      { error: 'La URL de la tienda no es válida — incluye https://.' },
      { status: 400 }
    )
  }

  if (urlTienda.protocol !== 'https:' && urlTienda.protocol !== 'http:') {
    return NextResponse.json({ error: 'La URL debe empezar por http:// o https://.' }, { status: 400 })
  }

  // http:// solo para desarrollo local (http://localhost:puerto) — cualquier
  // otro host tiene que ser https:, para que el token no viaje en claro.
  // Aprobado explícitamente antes de aplicarlo, ver audit-saas-security.md §2.
  if (urlTienda.protocol === 'http:' && !(await isHttpAllowedForHostname(urlTienda.hostname))) {
    return NextResponse.json(
      { error: 'http:// solo se permite para localhost (desarrollo). Usa https:// para cualquier otra tienda.' },
      { status: 400 }
    )
  }

  // Chequeo "amigable" — falla rápido con un mensaje claro en el caso común.
  // NO es la protección real contra SSRF (un host puede resolver distinto en
  // la próxima petición real, ver comentario en ssrf-guard.ts): esa vive en
  // el `lookup`/connector de cada fetch real en src/lib/store-api.ts, que se
  // aplica en TODAS las llamadas futuras a esta tienda, no solo aquí.
  const hostCheck = await validateHostnameForConnect(urlTienda.hostname)
  if (!hostCheck.ok) {
    return NextResponse.json({ error: hostCheck.reason }, { status: 400 })
  }

  // 32 bytes de un CSPRNG, base64url (~43 caracteres, sin padding, seguro
  // para pegar en un .env sin escapar nada).
  const apiToken = randomBytes(32).toString('base64url')

  const { data, error } = await supabase
    .from('stores')
    .insert({
      client_id: client.id,
      nombre: nombre.trim(),
      url_tienda: urlTienda.toString(),
      api_token: apiToken,
    })
    .select('id')
    .single()

  if (error || !data) {
    const message =
      error?.code === '23505'
        ? 'Ya tienes una tienda conectada con esa URL.'
        : 'No se pudo conectar la tienda.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ id: data.id, apiToken })
}
