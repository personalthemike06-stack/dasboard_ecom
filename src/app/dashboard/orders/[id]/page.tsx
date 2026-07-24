import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/StatusBadge'
import { Reveal } from '@/components/Reveal'
import { orderStatusInfo } from '@/lib/status-colors'
import { formatCurrency, formatDateTime } from '@/lib/format'

export const dynamic = 'force-dynamic'

// order_items reales: sin bundle_id/bundle_name — una línea solo referencia
// producto (o variante), nunca un pack por separado.
type OrderItemRow = {
  id: string
  nombre_producto: string
  cantidad: number
  precio_unitario: number
  precio_total: number
}

// orders real: direccion_envio es un string ya formado (ver checkout-orders.ts
// / orders.ts en el repo de la tienda — comma-joined, no JSON estructurado),
// no hay columnas shipping_* separadas ni admin_notes.
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
}

function metodoPagoLabel(metodo: string | null) {
  if (!metodo) return '—'
  const key = metodo.toLowerCase()
  if (key === 'card') return 'Tarjeta'
  if (key === 'cod') return 'Contrareembolso'
  return metodo
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: order, error: orderError }, { data: items, error: itemsError }] =
    await Promise.all([
      supabase
        .from('orders')
        .select(
          'id, numero_pedido, email_cliente, nombre_cliente, telefono_cliente, estado, subtotal, descuento, gastos_envio, total, metodo_pago, direccion_envio, notas_cliente, fecha_creacion'
        )
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('order_items')
        .select('id, nombre_producto, cantidad, precio_unitario, precio_total')
        .eq('order_id', id)
        .order('id', { ascending: true }),
    ])

  if (orderError || itemsError) {
    return (
      <p className="text-sm text-red-600">
        Error cargando el pedido: {orderError?.message ?? itemsError?.message}. Aplica
        database/dashboard-rls-002.sql.
      </p>
    )
  }

  if (!order) notFound()

  const detail = order as OrderDetail
  const orderStatus = orderStatusInfo(detail.estado)
  const direccion =
    typeof detail.direccion_envio === 'string' ? detail.direccion_envio : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-accent hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Pedidos
          </Link>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            {detail.numero_pedido}
          </h2>
          <p className="text-sm text-slate-500">{formatDateTime(detail.fecha_creacion)}</p>
        </div>
        <StatusBadge label={orderStatus.label} tone={orderStatus.tone} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Reveal className="card p-4">
            <h3 className="text-sm font-semibold text-slate-900">Artículos</h3>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="py-2">Producto</th>
                  <th className="py-2">Cantidad</th>
                  <th className="py-2">Precio</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(items ?? []).map((item: OrderItemRow) => (
                  <tr key={item.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2 text-slate-900">{item.nombre_producto}</td>
                    <td className="py-2 text-slate-600">{item.cantidad}</td>
                    <td className="py-2 text-slate-600">{formatCurrency(item.precio_unitario)}</td>
                    <td className="py-2 text-right font-medium tabular-nums text-slate-900">
                      {formatCurrency(item.precio_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
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
          </Reveal>

          {detail.notas_cliente && (
            <Reveal delay={0.08} className="card p-4">
              <h3 className="text-sm font-semibold text-slate-900">Notas del cliente</h3>
              <p className="mt-1 text-sm text-slate-600">{detail.notas_cliente}</p>
            </Reveal>
          )}
        </div>

        <div className="space-y-4">
          <Reveal delay={0.05} className="card p-4">
            <h3 className="text-sm font-semibold text-slate-900">Envío</h3>
            <div className="mt-2 space-y-0.5 text-sm text-slate-600">
              <p className="text-slate-900">{detail.nombre_cliente ?? '—'}</p>
              {detail.email_cliente && <p>{detail.email_cliente}</p>}
              {detail.telefono_cliente && <p>{detail.telefono_cliente}</p>}
              <p>{direccion ?? '—'}</p>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="card p-4">
            <h3 className="text-sm font-semibold text-slate-900">Pago</h3>
            <p className="mt-2 text-sm text-slate-600">
              Método: {metodoPagoLabel(detail.metodo_pago)}
            </p>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
