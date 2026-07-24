import { Users } from 'lucide-react'
import { ActiveUsersCounter } from '@/components/ActiveUsersCounter'
import { PagesNowCard } from '@/components/PagesNowCard'
import { VisitorsRangeSelector } from '@/components/VisitorsRangeSelector'
import { VisitorsChart } from '@/components/VisitorsChart'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { Reveal } from '@/components/Reveal'
import { AutoRefresh } from '@/components/AutoRefresh'
import { NoStoreConnected } from '@/components/NoStoreConnected'
import { StoreConnectionError } from '@/components/StoreConnectionError'
import { getSelectedStore } from '@/lib/stores'
import { getStoreStats } from '@/lib/store-api'
import { buildDailyVisitorSeries } from '@/lib/visitors'
import { formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

const AUTO_REFRESH_MS = 20_000

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

function resolveVisitorRange(params: { vrange?: string; vfrom?: string; vto?: string }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (params.vrange === 'today') {
    return { from: today, to: today }
  }
  if (params.vrange === '30d') {
    const from = new Date(today)
    from.setDate(from.getDate() - 29)
    return { from, to: today }
  }
  if (params.vrange === 'custom' && params.vfrom && params.vto) {
    const from = new Date(`${params.vfrom}T00:00:00`)
    const to = new Date(`${params.vto}T00:00:00`)
    if (from <= to) return { from, to }
  }
  // Por defecto (y valor de '7d'): últimos 7 días, incluido hoy.
  const from = new Date(today)
  from.setDate(from.getDate() - 6)
  return { from, to: today }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ vrange?: string; vfrom?: string; vto?: string }>
}) {
  const params = await searchParams
  const { from, to } = resolveVisitorRange(params)

  const store = await getSelectedStore()
  if (!store) {
    return <NoStoreConnected />
  }

  const todayStr = toDateStr(new Date())

  // "Hoy" se pide aparte del rango del gráfico a propósito: si eliges un
  // rango personalizado en el pasado, la cifra destacada sigue siendo la de
  // hoy de verdad, no el último día del rango elegido. activeNow (sesiones
  // activas + páginas) es independiente del rango pedido en ambas llamadas
  // — se usa la del rango, cualquiera de las dos sirve igual.
  const [rangeResult, todayResult] = await Promise.all([
    getStoreStats(store, { from: toDateStr(from), to: toDateStr(to) }),
    getStoreStats(store, { from: todayStr, to: todayStr }),
  ])

  if (!rangeResult.ok) return <StoreConnectionError message={rangeResult.error} />
  if (!todayResult.ok) return <StoreConnectionError message={todayResult.error} />

  const days = buildDailyVisitorSeries(rangeResult.data.visitors.byDay, from, to)
  const visitorsToday = todayResult.data.visitors.total

  return (
    <div className="space-y-10">
      <AutoRefresh intervalMs={AUTO_REFRESH_MS} />

      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Contador en vivo</h2>
        <p className="text-sm text-slate-500">
          Sesiones activas · se actualiza solo cada {AUTO_REFRESH_MS / 1000}s
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal>
          <ActiveUsersCounter
            sessions={rangeResult.data.activeNow.sessions}
            byDevice={rangeResult.data.activeNow.byDevice}
            generatedAt={rangeResult.data.generatedAt}
          />
        </Reveal>
        <Reveal delay={0.08}>
          <PagesNowCard pages={rangeResult.data.activeNow.byPage} />
        </Reveal>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Visitantes por día</h2>
            <p className="text-sm text-slate-500">Sesiones únicas con consentimiento, agrupadas por día</p>
          </div>
          <VisitorsRangeSelector />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          <Reveal delay={0.1} className="card p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft">
                <Users className="h-4 w-4 text-accent" strokeWidth={2} />
              </span>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Visitantes hoy</p>
            </div>
            <AnimatedNumber
              value={visitorsToday}
              format="integer"
              className="bg-gradient-accent mt-3 block bg-clip-text text-4xl font-bold tabular-nums text-transparent"
            />
          </Reveal>

          <Reveal delay={0.15} className="card p-4">
            <VisitorsChart days={days} />
          </Reveal>
        </div>

        <Reveal delay={0.2} className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2">Día</th>
                <th className="px-4 py-2">Visitantes</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((d, i) => (
                <tr
                  key={d.day}
                  className="border-b border-slate-50 last:border-0"
                  style={{ backgroundColor: i % 2 === 1 ? '#fafafa' : undefined }}
                >
                  <td className="px-4 py-2 text-slate-600">{formatDate(d.day)}</td>
                  <td className="px-4 py-2 font-medium tabular-nums text-slate-900">{d.visitors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </div>
  )
}
