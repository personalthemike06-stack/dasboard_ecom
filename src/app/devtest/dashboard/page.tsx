'use client'

import { Suspense } from 'react'
import { Activity, Users } from 'lucide-react'
import { DevtestShell } from '@/components/DevtestShell'
import { PagesNowCard } from '@/components/PagesNowCard'
import { VisitorsRangeSelector } from '@/components/VisitorsRangeSelector'
import { VisitorsChart } from '@/components/VisitorsChart'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { Reveal } from '@/components/Reveal'
import { STATUS_COLORS } from '@/lib/status-colors'
import { formatDate } from '@/lib/format'
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

const visitorsToday = MOCK_DAYS[MOCK_DAYS.length - 1].visitors

export default function DevTestDashboardPage() {
  return (
    <DevtestShell currentPath="/dashboard">
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Contador en vivo</h2>
          <p className="text-sm text-slate-500">Sesiones activas en tiempo real</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Reveal className="card p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft">
                  <Activity className="h-4 w-4 text-accent" strokeWidth={2} />
                </span>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Usuarios activos ahora
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

            <AnimatedNumber
              value={7}
              format="integer"
              className="mt-4 block text-6xl font-bold tracking-tight text-slate-900"
            />

            <p className="mt-3 text-sm text-slate-500">4 móvil · 3 escritorio</p>
            <p className="mt-1 text-xs text-slate-400">Actualizado 12:41:07</p>
          </Reveal>

          <Reveal delay={0.08}>
            <PagesNowCard mockPages={MOCK_PAGES_NOW} />
          </Reveal>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">Visitantes por día</h2>
              <p className="text-sm text-slate-500">Sesiones únicas con consentimiento, agrupadas por día</p>
            </div>
            <Suspense fallback={null}>
              <VisitorsRangeSelector />
            </Suspense>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
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
                className="mt-3 block text-4xl font-bold tabular-nums text-slate-900"
              />
            </Reveal>

            <Reveal delay={0.15} className="card p-4">
              <VisitorsChart days={MOCK_DAYS} />
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
                {[...MOCK_DAYS].reverse().map((d, i) => (
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
    </DevtestShell>
  )
}
