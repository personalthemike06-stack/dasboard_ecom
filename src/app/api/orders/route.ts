// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders — proxy server-side hacia GET /api/dashboard/orders de la
// tienda seleccionada. Usado por OrdersGrid (Client Component) SOLO para
// "Cargar más" (paginación incremental) — la primera página la pide
// orders/page.tsx directamente vía store-api.ts, server-side, sin pasar por
// esta ruta. Igual que /api/orders/[id]: existe para que el api_token de la
// tienda nunca cruce al navegador.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentClient } from '@/lib/supabase/server'
import { getSelectedStore } from '@/lib/stores'
import { getOrders } from '@/lib/store-api'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

function parseLimit(value: string | null): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return DEFAULT_LIMIT
  return Math.min(Math.max(1, Math.trunc(n)), MAX_LIMIT)
}

function parseOffset(value: string | null): number {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0
}

export async function GET(req: NextRequest) {
  const client = await getCurrentClient()
  if (!client) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const store = await getSelectedStore()
  if (!store) {
    return NextResponse.json({ error: 'No tienes ninguna tienda conectada.' }, { status: 404 })
  }

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined
  const limit = parseLimit(searchParams.get('limit'))
  const offset = parseOffset(searchParams.get('offset'))

  const result = await getOrders(store, { status, from, to, limit, offset })
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json(result.data)
}
