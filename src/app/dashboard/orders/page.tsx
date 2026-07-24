import Link from 'next/link'
import { PackageSearch } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { OrdersFilters } from '@/components/OrdersFilters'
import { StatusBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/EmptyState'
import { Reveal } from '@/components/Reveal'
import { orderStatusInfo, STATUS_COLORS } from '@/lib/status-colors'
import { formatCurrency, formatDateTime } from '@/lib/format'

export const dynamic = 'force-dynamic'

// Columnas reales de orders (supabase/schema.sql de la tienda, español) —
// no shipping_city: no existe como columna propia, direccion_envio es un
// único string libre (ver detalle del pedido).
type OrderRow = {
  id: string
  numero_pedido: string
  nombre_cliente: string | null
  estado: string
  total: number
  fecha_creacion: string
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>
}) {
  const { status, from, to } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('id, numero_pedido, nombre_cliente, estado, total, fecha_creacion')
    .order('fecha_creacion', { ascending: false })
    .limit(200)

  if (status) query = query.eq('estado', status)
  if (from) query = query.gte('fecha_creacion', `${from}T00:00:00`)
  if (to) query = query.lte('fecha_creacion', `${to}T23:59:59.999`)

  const { data, error } = await query
  const orders = (data ?? []) as OrderRow[]
  const isFiltered = Boolean(status || from || to)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Pedidos</h2>
        <p className="text-sm text-slate-500">
          {orders.length} pedido{orders.length === 1 ? '' : 's'}
          {isFiltered && ' (filtrado)'}
        </p>
      </div>

      <Reveal className="card p-4">
        <OrdersFilters />
      </Reveal>

      {error && (
        <p className="text-sm" style={{ color: STATUS_COLORS.critical }}>
          Error leyendo orders: {error.message}. Aplica database/dashboard-rls-002.sql.
        </p>
      )}

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
            {orders.map((order, i) => {
              const orderStatus = orderStatusInfo(order.estado)
              return (
                <tr
                  key={order.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  style={{ backgroundColor: i % 2 === 1 ? '#fafafa' : undefined }}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {order.numero_pedido}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{order.nombre_cliente ?? '—'}</td>
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

        {orders.length === 0 && !error && (
          <EmptyState
            icon={PackageSearch}
            title={isFiltered ? 'Sin pedidos con estos filtros' : 'Sin pedidos todavía'}
            description={
              isFiltered
                ? 'Prueba a limpiar o cambiar los filtros de arriba.'
                : 'Los pedidos de la tienda aparecerán aquí en cuanto entren.'
            }
          />
        )}
      </Reveal>
    </div>
  )
}
