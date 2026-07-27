// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/[id] — proxy server-side hacia GET /api/dashboard/orders/[id]
// de la tienda seleccionada (healzypp-clean). Existe SOLO para que el drawer
// de detalle del pedido (Client Component) pueda pedir los datos sin que el
// api_token de la tienda cruce nunca al navegador — ver el comentario sobre
// Store/api_token en src/lib/stores.ts y src/lib/store-api.ts.
//
// La respuesta incluye datos personales del cliente final (nombre, email,
// teléfono, dirección) — igual que la API de la tienda, esta ruta nunca se
// cachea ni debe persistirse en ningún sitio del lado del dashboard.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { getCurrentClient } from '@/lib/supabase/server'
import { getSelectedStore } from '@/lib/stores'
import { getOrderDetail } from '@/lib/store-api'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Dedicado y más estricto que cualquier límite general de este repo (que
// hoy no tiene ninguno más, ver audit-saas-security.md §5) — esta es la
// única ruta de este dashboard que devuelve PII de un cliente final
// (nombre/email/teléfono/dirección), así que merece su propio techo. El
// límite compartido de la tienda (orderDetailRatelimit, 30/min por token)
// sigue aplicando además de este — este es un segundo techo, por cliente
// del SaaS en vez de por token de tienda, para el caso de varios usuarios
// del mismo cliente abriendo pedidos a la vez desde el mismo token.
const ORDER_DETAIL_MAX = 30
const ORDER_DETAIL_WINDOW_MS = 60 * 1000

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = await getCurrentClient()
  if (!client) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'ID de pedido inválido' }, { status: 400 })
  }

  const rateLimit = checkRateLimit(`order-detail:${client.id}`, ORDER_DETAIL_MAX, ORDER_DETAIL_WINDOW_MS)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas peticiones. Prueba de nuevo en un momento.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.max(0, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))) },
      }
    )
  }

  const store = await getSelectedStore()
  if (!store) {
    return NextResponse.json({ error: 'No tienes ninguna tienda conectada.' }, { status: 404 })
  }

  const result = await getOrderDetail(store, id)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  // Log de auditoría — SOLO metadatos (qué cliente del SaaS, qué tienda, qué
  // pedido, cuándo), nunca el contenido del pedido (result.data sí lo trae,
  // pero no entra en esta línea).
  console.log(
    '[audit] order_detail_access',
    JSON.stringify({ client_id: client.id, store_id: store.id, order_id: id, at: new Date().toISOString() })
  )

  return NextResponse.json(result.data, { headers: { 'Cache-Control': 'no-store' } })
}
