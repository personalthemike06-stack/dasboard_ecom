import { getSelectedStore } from '@/lib/stores'
import { getOrders } from '@/lib/store-api'
import { NoStoreConnected } from '@/components/NoStoreConnected'
import { StoreConnectionError } from '@/components/StoreConnectionError'
import { OrdersFilters } from '@/components/OrdersFilters'
import { OrdersGrid } from '@/components/OrdersGrid'
import { Reveal } from '@/components/Reveal'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>
}) {
  const { status, from, to } = await searchParams

  const store = await getSelectedStore()
  if (!store) return <NoStoreConnected />

  const result = await getOrders(store, { status, from, to, limit: PAGE_SIZE, offset: 0 })
  if (!result.ok) return <StoreConnectionError message={result.error} />

  const isFiltered = Boolean(status || from || to)
  const { orders, total, hasMore } = result.data

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Pedidos</h2>
        <p className="text-sm text-slate-500">
          {total} pedido{total === 1 ? '' : 's'}
          {isFiltered && ' (filtrado)'}
        </p>
      </div>

      <Reveal className="card p-4">
        <OrdersFilters />
      </Reveal>

      {/* key fuerza a remontar OrdersGrid (y a resetear su estado
          orders/hasMore) cuando cambian los filtros — la página siempre
          vuelve a pedir la primera página server-side en ese caso. */}
      <OrdersGrid
        key={`${status ?? ''}|${from ?? ''}|${to ?? ''}`}
        initialOrders={orders}
        initialHasMore={hasMore}
        status={status}
        from={from}
        to={to}
        isFiltered={isFiltered}
      />
    </div>
  )
}
