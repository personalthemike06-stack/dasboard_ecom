import { Layers, PackageX } from 'lucide-react'
import { getSelectedStore } from '@/lib/stores'
import { getProducts } from '@/lib/store-api'
import { NoStoreConnected } from '@/components/NoStoreConnected'
import { StoreConnectionError } from '@/components/StoreConnectionError'
import { ProductCard } from '@/components/ProductCard'
import { BundleCard } from '@/components/BundleCard'
import { EmptyState } from '@/components/EmptyState'
import { Reveal } from '@/components/Reveal'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const store = await getSelectedStore()
  if (!store) return <NoStoreConnected />

  const result = await getProducts(store)
  if (!result.ok) return <StoreConnectionError message={result.error} />

  const { products, bundles } = result.data

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Productos</h2>
        <p className="text-sm text-slate-500">
          {products.length} producto{products.length === 1 ? '' : 's'} · solo lectura, salvo el
          estado activo/inactivo
        </p>
      </div>

      {products.length === 0 && (
        <Reveal className="card">
          <EmptyState
            icon={PackageX}
            title="Sin productos todavía"
            description="El catálogo de la tienda aparecerá aquí en cuanto haya productos."
          />
        </Reveal>
      )}

      {products.length > 0 && (
        <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Reveal>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-900">Packs</h3>
        <p className="text-xs text-slate-400">
          {bundles.length} pack{bundles.length === 1 ? '' : 's'}
        </p>
      </div>

      {bundles.length === 0 && (
        <Reveal delay={0.08} className="card">
          <EmptyState icon={Layers} title="Sin packs todavía" />
        </Reveal>
      )}

      {bundles.length > 0 && (
        <Reveal delay={0.08} className="flex flex-wrap gap-4">
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </Reveal>
      )}
    </div>
  )
}
