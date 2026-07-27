import { Activity, Users } from 'lucide-react'
import { getSelectedStore } from '@/lib/stores'
import { getStoreStats } from '@/lib/store-api'
import { getCountryCentroid } from '@/lib/geo/country-centroids'
import { WorldMap, type MapPoint } from '@/components/WorldMap'
import { AutoRefresh } from '@/components/AutoRefresh'
import { NoStoreConnected } from '@/components/NoStoreConnected'
import { StoreConnectionError } from '@/components/StoreConnectionError'
import { StatusBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/EmptyState'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { Reveal } from '@/components/Reveal'
import { describePage } from '@/lib/page-types'

export const dynamic = 'force-dynamic'

const AUTO_REFRESH_MS = 30_000

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

/**
 * Igual que Contador: ya no es 'use client' con useActiveSessions/useTopPages
 * (Realtime + RLS directo contra la Supabase de la tienda — imposible ahora,
 * este dashboard solo tiene acceso a la Supabase del SaaS). activeNow de
 * GET /api/dashboard/stats no depende del rango from/to (siempre son los
 * últimos 5 minutos), así que se pide con el rango más pequeño posible (hoy)
 * — de paso, ese mismo rango es lo que necesita la tarjeta "Total de hoy"
 * de abajo (result.data.visitors.total), sin pedir nada aparte.
 *
 * WorldMap.tsx (el globo real) no se toca en este rediseño — solo el
 * contenedor que lo envuelve aquí, en esta página.
 */
export default async function MapPage() {
  const store = await getSelectedStore()
  if (!store) return <NoStoreConnected />

  const today = toDateStr(new Date())
  const result = await getStoreStats(store, { from: today, to: today })
  if (!result.ok) return <StoreConnectionError message={result.error} />

  const { activeNow, visitors } = result.data

  const points: MapPoint[] = activeNow.byCountry
    .map((entry) => {
      const centroid = getCountryCentroid(entry.country)
      if (!centroid) return null
      return {
        key: entry.country,
        lat: centroid.lat,
        lng: centroid.lng,
        count: entry.count,
        countryName: centroid.name,
        cities: entry.cities.map((c) => ({ name: c.city, count: c.count })),
      } satisfies MapPoint
    })
    .filter((p): p is MapPoint => p !== null)
    .sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-4">
      <AutoRefresh intervalMs={AUTO_REFRESH_MS} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Sesiones activas por país
          </h2>
          <p className="text-sm text-slate-500">
            Últimos 5 minutos · el tamaño del punto es proporcional a las sesiones activas · pasa
            el ratón para ver ciudades
          </p>
        </div>
        <StatusBadge label={`En vivo · cada ${AUTO_REFRESH_MS / 1000}s`} tone="good" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <Reveal
          className="relative overflow-hidden rounded-2xl p-4 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.18)]"
          style={{ background: 'radial-gradient(circle at 50% 35%, #ffffff 0%, #eef1f7 100%)' }}
        >
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full border border-white/60 bg-white/70 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-md">
            <Activity className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
            {activeNow.sessions} {activeNow.sessions === 1 ? 'sesión activa' : 'sesiones activas'} ahora
          </div>

          <WorldMap points={points} />

          {activeNow.withoutCountry > 0 && (
            <p className="mt-2 text-xs text-slate-400">
              {activeNow.withoutCountry} sesión(es) activa(s) sin país detectado, no aparecen en
              el mapa.
            </p>
          )}
        </Reveal>

        <div className="flex flex-col gap-4">
          <Reveal delay={0.1} className="card p-4">
            <h3 className="text-sm font-semibold text-slate-900">Páginas más vistas ahora</h3>
            <p className="text-xs text-slate-400">Últimos 5 minutos</p>

            {activeNow.byPage.length === 0 ? (
              <div className="mt-2">
                <EmptyState
                  icon={Users}
                  title="Nadie navegando ahora"
                  description="Los datos aparecerán aquí en cuanto haya actividad."
                />
              </div>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {activeNow.byPage.map((p) => {
                  const page = describePage(p.path)
                  const Icon = page.icon
                  return (
                    <li key={p.path} className="flex items-center gap-2.5 text-sm">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: page.bg }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: page.text }} strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-slate-700">{page.label}</span>
                      <span className="shrink-0 font-semibold tabular-nums text-slate-900">{p.count}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Reveal>

          <Reveal delay={0.15} className="rounded-2xl p-5" style={{ backgroundColor: 'var(--accent)' }}>
            <p className="text-xs font-medium tracking-wide text-white/80 uppercase">Total de hoy</p>
            <AnimatedNumber
              value={visitors.total}
              format="integer"
              className="mt-1 block text-3xl font-bold text-white"
            />
            <p className="mt-1 text-xs text-white/70">
              {visitors.total === 1 ? 'visitante' : 'visitantes'}
            </p>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
