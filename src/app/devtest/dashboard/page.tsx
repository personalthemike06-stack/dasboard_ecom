'use client'

import { Suspense } from 'react'
import { DevtestShell } from '@/components/DevtestShell'
import { ActiveUsersCounter } from '@/components/ActiveUsersCounter'
import { PagesNowCard } from '@/components/PagesNowCard'
import { VisitorsRangeSelector } from '@/components/VisitorsRangeSelector'
import { VisitorsChart } from '@/components/VisitorsChart'
import { Reveal } from '@/components/Reveal'
import type { DailyVisitors } from '@/lib/visitors'

const MOCK_PAGES_NOW = [
  { path: '/', count: 3 },
  { path: '/producto/gominolas-vinagre-manzana', count: 2 },
  { path: '/checkout', count: 1 },
  { path: '/producto/gominolas-colageno', count: 1 },
]

const MOCK_DAYS: DailyVisitors[] = [
  { day: '2026-07-17', label: '17/07', visitors: 4 },
  { day: '2026-07-18', label: '18/07', visitors: 7 },
  { day: '2026-07-19', label: '19/07', visitors: 3 },
  { day: '2026-07-20', label: '20/07', visitors: 9 },
  { day: '2026-07-21', label: '21/07', visitors: 6 },
  { day: '2026-07-22', label: '22/07', visitors: 11 },
  { day: '2026-07-23', label: '23/07', visitors: 8 },
]

export default function DevTestDashboardPage() {
  return (
    <DevtestShell currentPath="/dashboard">
      <div className="space-y-10">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Contador en vivo</h2>
          <p className="text-sm text-slate-500">Sesiones activas en tiempo real</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal>
            <ActiveUsersCounter
              sessions={7}
              byDevice={[
                { device: 'mobile', count: 4 },
                { device: 'desktop', count: 3 },
              ]}
              generatedAt={new Date().toISOString()}
            />
          </Reveal>
          <Reveal delay={0.08}>
            <PagesNowCard pages={MOCK_PAGES_NOW} />
          </Reveal>
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">Visitantes por día</h2>
              <p className="text-sm text-slate-500">Sesiones únicas con consentimiento, agrupadas por día</p>
            </div>
            <Suspense fallback={null}>
              <VisitorsRangeSelector />
            </Suspense>
          </div>

          <Reveal delay={0.1} className="card p-6">
            <VisitorsChart days={MOCK_DAYS} periodLabel="esta semana" />
          </Reveal>
        </div>
      </div>
    </DevtestShell>
  )
}
