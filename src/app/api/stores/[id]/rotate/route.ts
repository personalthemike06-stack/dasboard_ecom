// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/stores/:id/rotate — genera un api_token nuevo para una tienda ya
// conectada, invalidando el anterior. Mismo patrón que POST /api/stores: el
// token lo genera el servidor (crypto.randomBytes(32)) y se devuelve UNA
// única vez en la respuesta — el cliente tiene que pegarlo como
// DASHBOARD_API_TOKEN en el .env de esa tienda y volver a desplegar. Hasta
// entonces, las llamadas de esta tienda fallarán con 401 (token antiguo ya
// no vale) — no hay periodo de gracia con los dos tokens activos a la vez,
// a propósito: si el motivo para rotar es que el token viejo se filtró,
// dejarlo vivo un tiempo más derrotaría el propósito.
//
// Antes no existía ninguna forma de rotar un token sin editar la fila a mano
// en Supabase (ver audit-saas-security.md §2/Fase 2).
// ─────────────────────────────────────────────────────────────────────────────

import { randomBytes } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient, getCurrentClient } from '@/lib/supabase/server'
import { isTrustedOrigin } from '@/lib/security/origin-check'
import { checkRateLimit } from '@/lib/rate-limit'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ROTATE_MAX = 10
const ROTATE_WINDOW_MS = 60 * 60 * 1000

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 })
  }

  const client = await getCurrentClient()
  if (!client) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'ID de tienda inválido' }, { status: 400 })
  }

  const rateLimit = checkRateLimit(`rotate-store:${client.id}`, ROTATE_MAX, ROTATE_WINDOW_MS)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos de rotar el token. Prueba de nuevo más tarde.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.max(0, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))) },
      }
    )
  }

  const apiToken = randomBytes(32).toString('base64url')

  const supabase = await createClient()

  // Sin .eq('client_id', client.id) explícito: client_update_own_stores
  // (database/saas-schema.sql) ya lo garantiza vía RLS — si la fila no es de
  // este cliente, el UPDATE afecta a 0 filas y .single() falla, igual que si
  // el id no existiera. Mismo criterio que el resto de mutaciones de este
  // repo (ver comentario de client_id en POST /api/stores).
  const { data, error } = await supabase
    .from('stores')
    .update({ api_token: apiToken })
    .eq('id', id)
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'No se pudo rotar el token de esa tienda.' }, { status: 404 })
  }

  return NextResponse.json({ id: data.id, apiToken })
}
