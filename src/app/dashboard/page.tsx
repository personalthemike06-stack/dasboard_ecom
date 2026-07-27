import { ActiveUsersCounter } from '@/components/ActiveUsersCounter'
import { PagesNowCard } from '@/components/PagesNowCard'
import { VisitorsRangeSelector } from '@/components/VisitorsRangeSelector'
import { VisitorsChart } from '@/components/VisitorsChart'
import { Reveal } from '@/components/Reveal'
import { AutoRefresh } from '@/components/AutoRefresh'
import { NoStoreConnected } from '@/components/NoStoreConnected'
import { StoreConnectionError } from '@/components/StoreConnectionError'
import { UpgradeNotice } from '@/components/UpgradeNotice'
import { getCurrentClient } from '@/lib/supabase/server'
import { getSelectedStore } from '@/lib/stores'
import { getStoreStats } from '@/lib/store-api'
import { buildDailyVisitorSeries } from '@/lib/visitors'
import { planHasFullAccess } from '@/lib/plans'

export const dynamic = 'force-dynamic'

const AUTO_REFRESH_MS = 30_000

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

function periodLabel(vrange: string | undefined) {
  if (vrange === 'today') return 'hoy'
  if (vrange === '30d') return 'este mes'
  if (vrange === 'custom') return 'en el periodo seleccionado'
  return 'esta semana'
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
  // Contador (esta página) no puede tener su propio layout.tsx — el de
  // /dashboard ya es el shell compartido por todas las rutas hijas — así que
  // el gating de plan va inline aquí, en vez de en un layout como en
  // dashboard/finance y dashboard/map. getCurrentClient está en cache() de
  // React, así que esta llamada no repite la consulta que ya hizo
  // dashboard/layout.tsx.
  const client = await getCurrentClient()
  if (!client || !planHasFullAccess(client.plan)) {
    return <UpgradeNotice feature="Contador" />
  }

  const params = await searchParams
  const { from, to } = resolveVisitorRange(params)

  const store = await getSelectedStore()
  if (!store) {
    return <NoStoreConnected />
  }

  // activeNow (sesiones activas + páginas) no depende del rango from/to
  // pedido — siempre son los últimos 5 minutos — así que una sola llamada
  // sirve tanto para eso como para la serie de visitantes del rango elegido.
  const rangeResult = await getStoreStats(store, { from: toDateStr(from), to: toDateStr(to) })

  if (!rangeResult.ok) return <StoreConnectionError message={rangeResult.error} />

  const days = buildDailyVisitorSeries(rangeResult.data.visitors.byDay, from, to)

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

        <Reveal delay={0.1} className="card p-6">
          <VisitorsChart days={days} periodLabel={periodLabel(params.vrange)} />
        </Reveal>
      </div>
    </div>
  )
}
