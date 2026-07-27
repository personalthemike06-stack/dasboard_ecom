'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Skeleton } from '@/components/Skeleton'
import { StatusBadge } from '@/components/StatusBadge'
import { orderStatusInfo, STATUS_COLORS } from '@/lib/status-colors'
import { formatCurrency, formatDateTime } from '@/lib/format'

// Mismos campos que devuelve GET /api/dashboard/orders/[id] (healzypp-clean,
// vía el proxy /api/orders/[id] de este repo) — direccion_envio es un string
// ya formado, no JSON estructurado (ver comentario histórico en el antiguo
// /dashboard/orders/[id]/page.tsx).
type OrderItem = {
  id: string
  nombre_producto: string
  cantidad: number
  precio_unitario: number
  precio_total: number
}

type OrderDetail = {
  id: string
  numero_pedido: string
  email_cliente: string | null
  nombre_cliente: string | null
  telefono_cliente: string | null
  estado: string
  subtotal: number
  descuento: number
  gastos_envio: number
  total: number
  metodo_pago: string | null
  direccion_envio: unknown
  notas_cliente: string | null
  fecha_creacion: string
  items: OrderItem[]
}

type DrawerState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; detail: OrderDetail }

function metodoPagoLabel(metodo: string | null) {
  if (!metodo) return '—'
  const key = metodo.toLowerCase()
  if (key === 'card') return 'Tarjeta'
  if (key === 'cod') return 'Contrareembolso'
  return metodo
}

/**
 * Nunca cachea ni persiste la respuesta (fetch con cache:'no-store', sin
 * SWR/estado global) — el detalle incluye datos personales del cliente
 * final, ver el comentario en /api/orders/[id]/route.ts.
 *
 * El padre debe montar esto con key={orderId}: así cada pedido distinto
 * arranca de verdad en su propio estado inicial 'loading', sin necesitar un
 * setState extra al principio del efecto solo para resetear el anterior.
 */
export function OrderDetailDrawer({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [state, setState] = useState<DrawerState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    fetch(`/api/orders/${orderId}`, { cache: 'no-store' })
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body?.error ?? 'No se pudo cargar el pedido.')
        return body as OrderDetail
      })
      .then((detail) => {
        if (!cancelled) setState({ status: 'ready', detail })
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'No se pudo cargar el pedido.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [orderId])

  const detail = state.status === 'ready' ? state.detail : null
  const orderStatus = detail ? orderStatusInfo(detail.estado) : null
  const direccion = typeof detail?.direccion_envio === 'string' ? detail.direccion_envio : null

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/30"
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {detail ? detail.numero_pedido : 'Detalle del pedido'}
            </h3>
            {detail && <p className="text-xs text-slate-500">{formatDateTime(detail.fecha_creacion)}</p>}
          </div>
          <div className="flex items-center gap-3">
            {orderStatus && <StatusBadge label={orderStatus.label} tone={orderStatus.tone} />}
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-900/[0.04] hover:text-slate-700"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {state.status === 'loading' && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {state.status === 'error' && (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: '#fbe4e4' }}
              >
                <AlertTriangle className="h-5 w-5" style={{ color: STATUS_COLORS.critical }} strokeWidth={2} />
              </span>
              <p className="text-sm text-slate-600">{state.message}</p>
            </div>
          )}

          {detail && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Artículos</h4>
                <table className="mt-2 w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      <th className="py-2">Producto</th>
                      <th className="py-2">Cant.</th>
                      <th className="py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-2 text-slate-900">{item.nombre_producto}</td>
                        <td className="py-2 text-slate-600">{item.cantidad}</td>
                        <td className="py-2 text-right font-medium tabular-nums text-slate-900">
                          {formatCurrency(item.precio_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(detail.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Envío</span>
                    <span>{formatCurrency(detail.gastos_envio)}</span>
                  </div>
                  {detail.descuento > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Descuento</span>
                      <span>-{formatCurrency(detail.descuento)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold text-slate-900">
                    <span>Total</span>
                    <span>{formatCurrency(detail.total)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-sm font-semibold text-slate-900">Envío</h4>
                <div className="mt-2 space-y-0.5 text-sm text-slate-600">
                  <p className="text-slate-900">{detail.nombre_cliente ?? '—'}</p>
                  {detail.email_cliente && <p>{detail.email_cliente}</p>}
                  {detail.telefono_cliente && <p>{detail.telefono_cliente}</p>}
                  <p>{direccion ?? '—'}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-sm font-semibold text-slate-900">Pago</h4>
                <p className="mt-2 text-sm text-slate-600">Método: {metodoPagoLabel(detail.metodo_pago)}</p>
              </div>

              {detail.notas_cliente && (
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-sm font-semibold text-slate-900">Notas del cliente</h4>
                  <p className="mt-1 text-sm text-slate-600">{detail.notas_cliente}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
