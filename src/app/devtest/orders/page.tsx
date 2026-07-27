'use client'

import { Suspense } from 'react'
import { DevtestShell } from '@/components/DevtestShell'
import { OrdersFilters } from '@/components/OrdersFilters'
import { OrderCard } from '@/components/OrderCard'
import { Reveal } from '@/components/Reveal'
import type { StoreOrderListRow } from '@/lib/store-api'

// Sin nombre/email/teléfono/dirección a propósito — mismo contrato que
// GET /api/dashboard/orders real (ver src/lib/store-api.ts), la tarjeta de
// lista nunca los recibe.
const MOCK_ORDERS: StoreOrderListRow[] = [
  { id: '1', numeroPedido: 'ORD-2026-000142', estado: 'pagado', total: 59.98, fechaCreacion: '2026-07-22T10:14:00', itemCount: 2 },
  { id: '2', numeroPedido: 'ORD-2026-000141', estado: 'enviado', total: 29.99, fechaCreacion: '2026-07-21T18:02:00', itemCount: 1 },
  { id: '3', numeroPedido: 'ORD-2026-000140', estado: 'procesando', total: 89.97, fechaCreacion: '2026-07-21T09:47:00', itemCount: 3 },
  { id: '4', numeroPedido: 'ORD-2026-000139', estado: 'pendiente', total: 29.99, fechaCreacion: '2026-07-20T21:30:00', itemCount: 1 },
  { id: '5', numeroPedido: 'ORD-2026-000138', estado: 'cancelado', total: 44.98, fechaCreacion: '2026-07-19T15:12:00', itemCount: 2 },
]

export default function DevTestOrdersPage() {
  return (
    <DevtestShell currentPath="/dashboard/orders">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Pedidos</h2>
          <p className="text-sm text-slate-500">{MOCK_ORDERS.length} pedidos</p>
        </div>

        <Reveal className="card p-4">
          <Suspense fallback={null}>
            <OrdersFilters />
          </Suspense>
        </Reveal>

        {/* Sin drawer real: no hay sesión/tienda en /devtest para pedir
            /api/orders/[id] de verdad — solo la cuadrícula de tarjetas. */}
        <Reveal delay={0.08} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MOCK_ORDERS.map((order) => (
            <OrderCard key={order.id} order={order} onClick={() => {}} />
          ))}
        </Reveal>
      </div>
    </DevtestShell>
  )
}
