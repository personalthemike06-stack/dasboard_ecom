import { PackageX, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductActiveToggle } from '@/components/ProductActiveToggle'
import { EmptyState } from '@/components/EmptyState'
import { Reveal } from '@/components/Reveal'
import { STATUS_COLORS } from '@/lib/status-colors'
import { formatCurrency } from '@/lib/format'

export const dynamic = 'force-dynamic'

// Columnas reales de products/bundles (supabase/schema.sql de la tienda,
// español). products.categoria es texto libre, no una FK a una tabla
// categories (esa tabla no existe). imagenes es JSONB (array de rutas
// relativas al dominio de la tienda) — no las renderizamos como <img> aquí
// porque esas rutas no resuelven en este proyecto, solo en healzyp.com.
type ProductRow = {
  id: string
  nombre: string
  categoria: string | null
  precio: number
  precio_original: number | null
  stock: number
  activo: boolean
}

type BundleRow = {
  id: string
  nombre: string
  cantidad: number
  precio: number
  porcentaje_dto: number | null
  es_popular: boolean
  activo: boolean
  product: { nombre: string } | null
}

function discountLabel(precio: number, precioOriginal: number | null) {
  if (!precioOriginal || precioOriginal <= precio) return '—'
  const pct = Math.round((1 - precio / precioOriginal) * 100)
  return `${pct}%`
}

export default async function ProductsPage() {
  const supabase = await createClient()

  const [{ data: products, error: productsError }, { data: bundles, error: bundlesError }] =
    await Promise.all([
      supabase
        .from('products')
        .select('id, nombre, categoria, precio, precio_original, stock, activo')
        .order('nombre', { ascending: true }),
      supabase
        .from('bundles')
        .select('id, nombre, cantidad, precio, porcentaje_dto, es_popular, activo, product:products(nombre)')
        .order('id', { ascending: true }),
    ])

  const productRows = (products ?? []) as unknown as ProductRow[]
  const bundleRows = (bundles ?? []) as unknown as BundleRow[]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Productos</h2>
        <p className="text-sm text-slate-500">
          {productRows.length} producto{productRows.length === 1 ? '' : 's'} · solo lectura,
          salvo el estado activo/inactivo
        </p>
      </div>

      {productsError && (
        <p className="text-sm" style={{ color: STATUS_COLORS.critical }}>
          Error leyendo products: {productsError.message}. Aplica database/dashboard-rls-002.sql.
        </p>
      )}

      <Reveal className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Descuento</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {productRows.map((product, i) => (
              <tr
                key={product.id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                style={{ backgroundColor: i % 2 === 1 ? '#fafafa' : undefined }}
              >
                <td className="px-4 py-3 font-medium text-slate-900">{product.nombre}</td>
                <td className="px-4 py-3 text-slate-600">{product.categoria ?? '—'}</td>
                <td className="px-4 py-3 tabular-nums text-slate-900">
                  {formatCurrency(product.precio)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {discountLabel(product.precio, product.precio_original)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={product.stock === 0 ? 'font-medium tabular-nums' : 'tabular-nums text-slate-600'}
                    style={product.stock === 0 ? { color: STATUS_COLORS.critical } : undefined}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ProductActiveToggle id={product.id} activo={product.activo} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {productRows.length === 0 && !productsError && (
          <EmptyState
            icon={PackageX}
            title="Sin productos todavía"
            description="El catálogo de la tienda aparecerá aquí en cuanto haya productos."
          />
        )}
      </Reveal>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">Packs (bundles)</h3>
        <p className="text-xs text-slate-400">
          {bundleRows.length} pack{bundleRows.length === 1 ? '' : 's'}
        </p>
      </div>

      {bundlesError && (
        <p className="text-sm" style={{ color: STATUS_COLORS.critical }}>
          Error leyendo bundles: {bundlesError.message}.
        </p>
      )}

      <Reveal delay={0.08} className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Pack</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {bundleRows.map((bundle, i) => (
              <tr
                key={bundle.id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                style={{ backgroundColor: i % 2 === 1 ? '#fafafa' : undefined }}
              >
                <td className="px-4 py-3 font-medium text-slate-900">
                  {bundle.nombre}
                  {bundle.es_popular && (
                    <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                      Popular
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{bundle.product?.nombre ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{bundle.cantidad}</td>
                <td className="px-4 py-3 tabular-nums text-slate-900">
                  {formatCurrency(bundle.precio)}
                  {bundle.porcentaje_dto ? (
                    <span className="ml-1.5 text-xs text-slate-400">-{bundle.porcentaje_dto}%</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-slate-600">{bundle.activo ? 'Activo' : 'Inactivo'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {bundleRows.length === 0 && !bundlesError && (
          <EmptyState icon={Layers} title="Sin packs todavía" />
        )}
      </Reveal>
    </div>
  )
}
