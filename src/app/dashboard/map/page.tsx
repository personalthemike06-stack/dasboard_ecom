import { getSelectedStore } from '@/lib/stores'
import { getStoreStats } from '@/lib/store-api'
import { getCountryCentroid } from '@/lib/geo/country-centroids'
import { WorldMap, type MapPoint } from '@/components/WorldMap'
import { AutoRefresh } from '@/components/AutoRefresh'
import { NoStoreConnected } from '@/components/NoStoreConnected'
import { StoreConnectionError } from '@/components/StoreConnectionError'
import { PagesNowCard } from '@/components/PagesNowCard'
import { Reveal } from '@/components/Reveal'

export const dynamic = 'force-dynamic'

const AUTO_REFRESH_MS = 20_000

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

/**
 * Igual que Contador: ya no es 'use client' con useActiveSessions/useTopPages
 * (Realtime + RLS directo contra la Supabase de la tienda — imposible ahora,
 * este dashboard solo tiene acceso a la Supabase del SaaS). activeNow de
 * GET /api/dashboard/stats no depende del rango from/to (siempre son los
 * últimos 5 minutos), así que se pide con el rango más pequeño posible (hoy)
 * solo para no desperdiciar la llamada en visitors/orders que no se usan
 * aquí.
 */
export default async function MapPage() {
  const store = await getSelectedStore()
  if (!store) return <NoStoreConnected />

  const today = toDateStr(new Date())
  const result = await getStoreStats(store, { from: today, to: today })
  if (!result.ok) return <StoreConnectionError message={result.error} />

  const { activeNow } = result.data

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
    <div className="space-y-6">
      <AutoRefresh intervalMs={AUTO_REFRESH_MS} />

      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Sesiones activas por país
        </h2>
        <p className="text-sm text-slate-500">
          Últimos 5 minutos · el tamaño del punto es proporcional a las sesiones activas · pasa el
          ratón para ver ciudades · se actualiza solo cada {AUTO_REFRESH_MS / 1000}s
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <Reveal className="card p-4">
          <WorldMap points={points} />
          {activeNow.withoutCountry > 0 && (
            <p className="mt-2 text-xs text-slate-400">
              {activeNow.withoutCountry} sesión(es) activa(s) sin país detectado, no aparecen en
              el mapa.
            </p>
          )}
        </Reveal>

        <Reveal delay={0.1}>
          <PagesNowCard
            pages={activeNow.byPage}
            title="Páginas más vistas ahora"
            subtitle="Últimos 5 minutos"
          />
        </Reveal>
      </div>
    </div>
  )
}
