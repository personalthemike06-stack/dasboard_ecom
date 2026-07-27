'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { DevtestShell } from '@/components/DevtestShell'
import { OrdersFilters } from '@/components/OrdersFilters'
import { StatusBadge } from '@/components/StatusBadge'
import { Reveal } from '@/components/Reveal'
import { orderStatusInfo } from '@/lib/status-colors'
import { formatCurrency, formatDateTime } from '@/lib/format'

const MOCK_ORDERS = [
  { id: '1', numero_pedido: 'ORD-2026-000142', nombre_cliente: 'María López', estado: 'pagado', total: 59.98, fecha_creacion: '2026-07-22T10:14:00' },
  { id: '2', numero_pedido: 'ORD-2026-000141', nombre_cliente: 'Carlos Ruiz', estado: 'enviado', total: 29.99, fecha_creacion: '2026-07-21T18:02:00' },
  { id: '3', numero_pedido: 'ORD-2026-000140', nombre_cliente: 'Ana Torres', estado: 'procesando', total: 89.97, fecha_creacion: '2026-07-21T09:47:00' },
  { id: '4', numero_pedido: 'ORD-2026-000139', nombre_cliente: 'Javier Gómez', estado: 'pendiente', total: 29.99, fecha_creacion: '2026-07-20T21:30:00' },
  { id: '5', numero_pedido: 'ORD-2026-000138', nombre_cliente: 'Lucía Fernández', estado: 'cancelado', total: 44.98, fecha_creacion: '2026-07-19T15:12:00' },
]

export default function DevTestOrdersPage() {
  return (
    <DevtestShell currentPath="/dashboard/orders">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Pedidos</h2>
          <p className="text-sm text-slate-500">{MOCK_ORDERS.length} pedidos</p>
        </div>

        <Reveal className="card p-4">
          <Suspense fallback={null}>
            <OrdersFilters />
          </Suspense>
        </Reveal>

        <Reveal delay={0.08} className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ORDERS.map((order, i) => {
                const orderStatus = orderStatusInfo(order.estado)
                return (
                  <tr
                    key={order.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                    style={{ backgroundColor: i % 2 === 1 ? '#fafafa' : undefined }}
                  >
                    <td className="px-4 py-3">
                      <Link href="#" className="font-medium text-accent hover:underline">
                        {order.numero_pedido}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{order.nombre_cliente}</td>
                    <td className="px-4 py-3">
                      <StatusBadge label={orderStatus.label} tone={orderStatus.tone} />
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums text-slate-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(order.fecha_creacion)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Reveal>
      </div>
    </DevtestShell>
  )
}
