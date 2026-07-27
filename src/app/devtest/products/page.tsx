'use client'

import { DevtestShell } from '@/components/DevtestShell'
import { ProductCard } from '@/components/ProductCard'
import { BundleCard } from '@/components/BundleCard'
import { Reveal } from '@/components/Reveal'
import type { StoreBundle, StoreProduct } from '@/lib/store-api'

const MOCK_PRODUCTS: StoreProduct[] = [
  { id: '1', nombre: 'Gominolas de Vinagre de Manzana', categoria: 'Suplementos', precio: 29.99, precioOriginal: 39.99, stock: 342, activo: true },
  { id: '2', nombre: 'Gominolas de Colágeno', categoria: 'Belleza', precio: 24.99, precioOriginal: null, stock: 0, activo: true },
  { id: '3', nombre: 'Gominolas Detox', categoria: 'Suplementos', precio: 19.99, precioOriginal: null, stock: 58, activo: false },
]

const MOCK_BUNDLES: StoreBundle[] = [
  { id: '1', nombre: 'Pack 2 Botes', productNombre: 'Gominolas de Vinagre de Manzana', cantidad: 2, precio: 44.99, porcentajeDto: 25, activo: true, esPopular: true },
  { id: '2', nombre: 'Pack 3 Botes', productNombre: 'Gominolas de Vinagre de Manzana', cantidad: 3, precio: 59.99, porcentajeDto: 33, activo: true, esPopular: false },
]

export default function DevTestProductsPage() {
  return (
    <DevtestShell currentPath="/dashboard/products">
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Productos</h2>
          <p className="text-sm text-slate-500">
            {MOCK_PRODUCTS.length} productos · solo lectura, salvo el estado activo/inactivo
          </p>
        </div>

        <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MOCK_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Reveal>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Packs</h3>
          <p className="text-xs text-slate-400">{MOCK_BUNDLES.length} packs</p>
        </div>

        <Reveal delay={0.08} className="flex flex-wrap gap-4">
          {MOCK_BUNDLES.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </Reveal>
      </div>
    </DevtestShell>
  )
}
