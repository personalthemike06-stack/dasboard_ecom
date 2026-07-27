'use client'

import { DevtestShell } from '@/components/DevtestShell'
import { ProductActiveToggle } from '@/components/ProductActiveToggle'
import { Reveal } from '@/components/Reveal'
import { STATUS_COLORS } from '@/lib/status-colors'
import { formatCurrency } from '@/lib/format'

const MOCK_PRODUCTS = [
  { id: '1', nombre: 'Gominolas de Vinagre de Manzana', categoria: 'Suplementos', precio: 29.99, precio_original: 39.99, stock: 342, activo: true },
  { id: '2', nombre: 'Gominolas de Colágeno', categoria: 'Belleza', precio: 24.99, precio_original: null, stock: 0, activo: true },
  { id: '3', nombre: 'Gominolas Detox', categoria: 'Suplementos', precio: 19.99, precio_original: null, stock: 58, activo: false },
]

const MOCK_BUNDLES = [
  { id: '1', nombre: 'Pack 2 Botes', producto: 'Gominolas de Vinagre de Manzana', cantidad: 2, precio: 44.99, porcentaje_dto: 25, activo: true, es_popular: true },
  { id: '2', nombre: 'Pack 3 Botes', producto: 'Gominolas de Vinagre de Manzana', cantidad: 3, precio: 59.99, porcentaje_dto: 33, activo: true, es_popular: false },
]

function discountLabel(precio: number, precioOriginal: number | null) {
  if (!precioOriginal || precioOriginal <= precio) return '—'
  return `${Math.round((1 - precio / precioOriginal) * 100)}%`
}

export default function DevTestProductsPage() {
  return (
    <DevtestShell currentPath="/dashboard/products">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Productos</h2>
          <p className="text-sm text-slate-500">
            {MOCK_PRODUCTS.length} productos · solo lectura, salvo el estado activo/inactivo
          </p>
        </div>

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
              {MOCK_PRODUCTS.map((product, i) => (
                <tr
                  key={product.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  style={{ backgroundColor: i % 2 === 1 ? '#fafafa' : undefined }}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{product.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{product.categoria}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-900">{formatCurrency(product.precio)}</td>
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
        </Reveal>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Packs (bundles)</h3>
          <p className="text-xs text-slate-400">{MOCK_BUNDLES.length} packs</p>
        </div>

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
              {MOCK_BUNDLES.map((bundle, i) => (
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
                  <td className="px-4 py-3 text-slate-600">{bundle.producto}</td>
                  <td className="px-4 py-3 text-slate-600">{bundle.cantidad}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-900">
                    {formatCurrency(bundle.precio)}
                    <span className="ml-1.5 text-xs text-slate-400">-{bundle.porcentaje_dto}%</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{bundle.activo ? 'Activo' : 'Inactivo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </DevtestShell>
  )
}
