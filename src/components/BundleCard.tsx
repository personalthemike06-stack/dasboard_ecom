import { formatCurrency } from '@/lib/format'
import type { StoreBundle } from '@/lib/store-api'

/**
 * es_popular=true se distingue con fondo SÓLIDO (bg-gradient-accent, igual
 * que los botones primarios del resto del dashboard) en vez de solo el
 * badge — el resto de packs llevan el mismo acento pero en versión suave
 * (accent-soft), para que "popular" se note incluso sin leer el badge.
 */
export function BundleCard({ bundle }: { bundle: StoreBundle }) {
  const opacityStyle = !bundle.activo ? { opacity: 0.65 } : undefined

  if (bundle.esPopular) {
    return (
      <div
        className="bg-gradient-accent flex min-w-[180px] flex-1 flex-col gap-1 rounded-xl p-4 text-white shadow-md"
        style={opacityStyle}
      >
        <span className="self-start rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          Popular
        </span>
        <p className="mt-1 text-sm font-semibold">{bundle.nombre}</p>
        <p className="text-xs text-white/80">
          {bundle.productNombre ?? '—'} · x{bundle.cantidad}
        </p>
        <p className="mt-2 text-2xl font-extrabold tabular-nums">{formatCurrency(bundle.precio)}</p>
        {bundle.porcentajeDto ? (
          <p className="text-xs text-white/80">-{bundle.porcentajeDto}% dto.</p>
        ) : null}
        {!bundle.activo && <p className="mt-1 text-xs text-white/70">Inactivo</p>}
      </div>
    )
  }

  return (
    <div
      className="flex min-w-[180px] flex-1 flex-col gap-1 rounded-xl bg-accent-soft p-4"
      style={opacityStyle}
    >
      <p className="text-sm font-semibold text-accent">{bundle.nombre}</p>
      <p className="text-xs text-accent/70">
        {bundle.productNombre ?? '—'} · x{bundle.cantidad}
      </p>
      <p className="mt-2 text-xl font-bold tabular-nums text-accent">{formatCurrency(bundle.precio)}</p>
      {bundle.porcentajeDto ? <p className="text-xs text-accent/70">-{bundle.porcentajeDto}% dto.</p> : null}
      {!bundle.activo && <p className="mt-1 text-xs text-slate-500">Inactivo</p>}
    </div>
  )
}
