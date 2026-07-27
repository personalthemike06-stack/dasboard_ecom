import type { DailyVisitors } from '@/lib/visitors'
import { buildVisitorChartBuckets } from '@/lib/visitors'
import { AnimatedNumber } from '@/components/AnimatedNumber'

const BAR_COLOR_MUTED = '#e2e8f0'

/**
 * Barras tipo calendario: una barra por día (o por semana si el rango
 * "Personalizado" es amplio, ver buildVisitorChartBuckets), altura
 * proporcional al máximo visible. La última barra (día/semana más reciente)
 * se resalta en el acento sólido, el resto en gris claro.
 */
export function VisitorsChart({ days, periodLabel }: { days: DailyVisitors[]; periodLabel: string }) {
  const total = days.reduce((sum, d) => sum + d.visitors, 0)
  const buckets = buildVisitorChartBuckets(days)
  const maxVisitors = Math.max(1, ...buckets.map((b) => b.visitors))

  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Visitantes</p>
      <div className="mt-1 flex items-baseline gap-2">
        <AnimatedNumber
          value={total}
          format="integer"
          className="bg-gradient-accent block bg-clip-text text-4xl font-bold tabular-nums text-transparent"
        />
        <span className="text-sm text-slate-500">{periodLabel}</span>
      </div>

      <div className="mt-6 flex items-end gap-1.5 overflow-x-auto pb-1">
        {buckets.map((b, i) => {
          const isLast = i === buckets.length - 1
          const heightPct = Math.max(4, (b.visitors / maxVisitors) * 100)
          return (
            <div key={b.key} className="flex min-w-[28px] flex-1 flex-col items-center gap-2">
              <div className="flex h-32 w-full items-end">
                <div
                  className="w-full rounded-t-md transition-[height] duration-500 ease-out"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: isLast ? 'var(--accent)' : BAR_COLOR_MUTED,
                  }}
                  title={`${b.label}: ${b.visitors} visitante${b.visitors === 1 ? '' : 's'}`}
                />
              </div>
              <span
                className="text-[10px] whitespace-nowrap"
                style={{ color: isLast ? 'var(--accent)' : '#94a3b8', fontWeight: isLast ? 600 : 400 }}
              >
                {b.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
