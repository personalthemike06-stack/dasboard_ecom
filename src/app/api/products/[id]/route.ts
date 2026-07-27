// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/products/[id] — proxy server-side hacia
// PATCH /api/dashboard/products/[id] de la tienda seleccionada (healzypp-clean).
// Existe por el mismo motivo que /api/orders/[id]: el api_token de la tienda
// nunca debe cruzar al navegador, así que ProductActiveToggle (Client
// Component) pasa por aquí en vez de llamar a la tienda directamente.
// Body solo admite { activo: boolean } — igual que el endpoint real.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentClient } from '@/lib/supabase/server'
import { getSelectedStore } from '@/lib/stores'
import { updateProductActive } from '@/lib/store-api'
import { isTrustedOrigin } from '@/lib/security/origin-check'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Ruta de estado autenticada por cookie de sesión, sin Server Action que lo
  // cubra automáticamente — ver audit-saas-security.md §4.2.
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 })
  }

  const client = await getCurrentClient()
  if (!client) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'ID de producto inválido' }, { status: 400 })
  }

  let body: { activo?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  if (typeof body.activo !== 'boolean') {
    return NextResponse.json({ error: 'Falta "activo" (boolean).' }, { status: 400 })
  }

  const store = await getSelectedStore()
  if (!store) {
    return NextResponse.json({ error: 'No tienes ninguna tienda conectada.' }, { status: 404 })
  }

  const result = await updateProductActive(store, id, body.activo)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json(result.data)
}
