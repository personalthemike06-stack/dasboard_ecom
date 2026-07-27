import { categoryStyle } from '@/lib/category-style'
import { ProductActiveToggle } from '@/components/ProductActiveToggle'
import { STATUS_COLORS } from '@/lib/status-colors'
import { formatCurrency } from '@/lib/format'
import type { StoreProduct } from '@/lib/store-api'

export function ProductCard({ product }: { product: StoreProduct }) {
  const style = categoryStyle(product.categoria)
  const Icon = style.icon
  const outOfStock = product.stock === 0

  return (
    <div
      className="card flex items-start gap-3 p-4"
      style={!product.activo ? { opacity: 0.65 } : undefined}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: style.bg }}
      >
        <Icon className="h-5 w-5" style={{ color: style.text }} strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{product.nombre}</p>
            <p className="text-xs font-medium" style={{ color: style.text }}>
              {product.categoria ?? 'Sin categoría'}
            </p>
          </div>
          <ProductActiveToggle id={product.id} activo={product.activo} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xl font-bold tabular-nums text-accent">{formatCurrency(product.precio)}</p>
          <p
            className={outOfStock ? 'text-sm font-bold tabular-nums' : 'text-sm tabular-nums text-slate-500'}
            style={outOfStock ? { color: STATUS_COLORS.critical } : undefined}
          >
            {outOfStock ? 'Sin stock' : `${product.stock} uds.`}
          </p>
        </div>
      </div>
    </div>
  )
}
