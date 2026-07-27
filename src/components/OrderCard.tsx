'use client'

import { Package } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { orderStatusInfo, STATUS_COLORS } from '@/lib/status-colors'
import { formatCurrency, formatDate } from '@/lib/format'
import type { StoreOrderListRow } from '@/lib/store-api'

/**
 * Sin datos personales del cliente (nombre/dirección/teléfono) a propósito
 * — StoreOrderListRow no los trae, ver /api/dashboard/orders en
 * healzypp-clean. Solo aparecen al abrir el detalle (OrderDetailDrawer),
 * vía /api/orders/[id].
 */
export function OrderCard({ order, onClick }: { order: StoreOrderListRow; onClick: () => void }) {
  const status = orderStatusInfo(order.estado)
  const isPending = order.estado === 'pendiente'

  return (
    <button
      onClick={onClick}
      className="card flex w-full flex-col gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
      style={isPending ? { borderColor: STATUS_COLORS.warning } : undefined}
    >
      <div className="flex items-center justify-between">
        <StatusBadge label={status.label} tone={status.tone} />
        <span className="text-xs text-slate-400">{formatDate(order.fechaCreacion)}</span>
      </div>

      <p className="text-xs font-medium text-slate-500">{order.numeroPedido}</p>

      <p className="text-2xl font-bold tabular-nums text-slate-900">{formatCurrency(order.total)}</p>

      {typeof order.itemCount === 'number' && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Package className="h-3.5 w-3.5" strokeWidth={2} />
          {order.itemCount} artículo{order.itemCount === 1 ? '' : 's'}
        </div>
      )}
    </button>
  )
}
