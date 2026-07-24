'use client'

import { DevtestShell } from '@/components/DevtestShell'
import { WorldMap, type MapPoint } from '@/components/WorldMap'
import { PagesNowCard } from '@/components/PagesNowCard'
import { Reveal } from '@/components/Reveal'
import { STATUS_COLORS } from '@/lib/status-colors'

const MOCK_POINTS: MapPoint[] = [
  { key: 'ES', lat: 40, lng: -4, count: 24, countryName: 'Spain', cities: [{ name: 'Madrid', count: 14 }, { name: 'Barcelona', count: 10 }] },
  { key: 'MX', lat: 23, lng: -102, count: 9, countryName: 'Mexico', cities: [{ name: 'CDMX', count: 9 }] },
  { key: 'US', lat: 39, lng: -98, count: 5, countryName: 'United States', cities: [{ name: 'Miami', count: 5 }] },
  { key: 'AR', lat: -34, lng: -64, count: 3, countryName: 'Argentina', cities: [{ name: 'Buenos Aires', count: 3 }] },
  { key: 'FR', lat: 46, lng: 2, count: 1, countryName: 'France', cities: [{ name: 'Paris', count: 1 }] },
]

const MOCK_PAGES = [
  { path: '/', count: 18 },
  { path: '/producto/gominolas-vinagre-manzana', count: 11 },
  { path: '/checkout', count: 4 },
]

export default function DevTestMapPage() {
  return (
    <DevtestShell currentPath="/dashboard/map">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Sesiones activas por país
            </h2>
            <p className="text-sm text-slate-500">
              Últimos 5 minutos · el tamaño del punto es proporcional a las sesiones
              activas · pasa el ratón para ver ciudades
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS.good }}
              aria-hidden
            />
            En vivo
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <Reveal className="card p-4">
            <WorldMap points={MOCK_POINTS} />
          </Reveal>

          <Reveal delay={0.1}>
            <PagesNowCard
              pages={MOCK_PAGES}
              title="Páginas más vistas ahora"
              subtitle="Últimos 5 minutos"
            />
          </Reveal>
        </div>
      </div>
    </DevtestShell>
  )
}
