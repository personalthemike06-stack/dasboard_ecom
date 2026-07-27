'use client'

import { useState } from 'react'
import { PackageSearch } from 'lucide-react'
import { OrderCard } from '@/components/OrderCard'
import { OrderDetailDrawer } from '@/components/OrderDetailDrawer'
import { EmptyState } from '@/components/EmptyState'
import { Reveal } from '@/components/Reveal'
import type { StoreOrderListRow } from '@/lib/store-api'

export function OrdersGrid({
  initialOrders,
  initialHasMore,
  status,
  from,
  to,
  isFiltered,
}: {
  initialOrders: StoreOrderListRow[]
  initialHasMore: boolean
  status?: string
  from?: string
  to?: string
  isFiltered: boolean
}) {
  const [orders, setOrders] = useState(initialOrders)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  async function loadMore() {
    setLoadingMore(true)
    setLoadError(null)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      params.set('limit', '20')
      params.set('offset', String(orders.length))

      const res = await fetch(`/api/orders?${params.toString()}`, { cache: 'no-store' })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? 'No se pudieron cargar más pedidos.')

      setOrders((prev) => [...prev, ...body.orders])
      setHasMore(Boolean(body.hasMore))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar más pedidos.')
    } finally {
      setLoadingMore(false)
    }
  }

  if (orders.length === 0) {
    return (
      <Reveal delay={0.08} className="card">
        <EmptyState
          icon={PackageSearch}
          title={isFiltered ? 'Sin pedidos con estos filtros' : 'Sin pedidos todavía'}
          description={
            isFiltered
              ? 'Prueba a limpiar o cambiar los filtros de arriba.'
              : 'Los pedidos de la tienda aparecerán aquí en cuanto entren.'
          }
        />
      </Reveal>
    )
  }

  return (
    <>
      <Reveal delay={0.08} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onClick={() => setSelectedId(order.id)} />
        ))}
      </Reveal>

      {loadError && (
        <p className="mt-3 text-center text-sm text-red-600">{loadError}</p>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            {loadingMore ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      )}

      {selectedId && (
        <OrderDetailDrawer key={selectedId} orderId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </>
  )
}
