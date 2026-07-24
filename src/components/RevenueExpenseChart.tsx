'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PeriodBucket } from '@/lib/finance'
import { formatCurrency, formatCurrencyCompact } from '@/lib/format'
import { niceAxisScale } from '@/lib/chart-scale'

// Paleta categórica del dashboard: slot 1 (azul, acento) / slot 2 (naranja),
// mismo orden fijo que el resto de la app — nunca se reasignan por serie.
// GASTOS_COLOR se queda en naranja a propósito (no verde/menta): con dos
// series en el mismo gráfico, la distinción categórica pesa más que seguir
// la paleta decorativa al pie de la letra, y un gasto en verde/menta leería
// como "positivo" cerca de STATUS_COLORS.good.
const INGRESOS_COLOR = '#3b82f6'
const GASTOS_COLOR = '#eb6834'
const GRID_COLOR = '#eef2f6'
const AXIS_LINE_COLOR = '#e2e8f0'
const MUTED_TEXT = '#94a3b8'

// Suelo mínimo cuando no hay datos (o son minúsculos): antes, con todo a
// 0€, el máximo "bonito" salía en 1€ y el eje mostraba fracciones absurdas
// (0,3 €, 0,5 €...). Con este suelo, un periodo sin actividad muestra una
// rejilla 0–40€ con marcas limpias en vez de céntimos sin sentido.
const MIN_AXIS_MAX = 40

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: PeriodBucket }[]
}) {
  if (!active || !payload?.length) return null
  const bucket = payload[0].payload

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-lg shadow-slate-900/5">
      <p className="font-semibold text-slate-900">{bucket.label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-slate-600">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: INGRESOS_COLOR }} aria-hidden />
        Ingresos <span className="ml-auto font-medium tabular-nums text-slate-900">{formatCurrency(bucket.ingresos)}</span>
      </p>
      <p className="flex items-center gap-1.5 text-slate-600">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: GASTOS_COLOR }} aria-hidden />
        Gastos <span className="ml-auto font-medium tabular-nums text-slate-900">{formatCurrency(bucket.gastos)}</span>
      </p>
      <p className="mt-1 flex items-center gap-1.5 border-t border-slate-100 pt-1 text-slate-600">
        Beneficio
        <span className="ml-auto font-medium tabular-nums text-slate-900">
          {formatCurrency(bucket.ingresos - bucket.gastos)}
        </span>
      </p>
    </div>
  )
}

export function RevenueExpenseChart({ buckets }: { buckets: PeriodBucket[] }) {
  const rawMax = Math.max(0, ...buckets.map((b) => Math.max(b.ingresos, b.gastos)))
  const { maxValue, ticks: yTicks } = niceAxisScale(rawMax, MIN_AXIS_MAX)

  // Mostrar como mucho ~10 etiquetas en el eje X para que no se amontonen
  // con "día" (hasta 30 puntos) o "semana"/"mes" (12 puntos ya caben solos).
  const labelStride = Math.max(1, Math.ceil(buckets.length / 10))

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: INGRESOS_COLOR }} aria-hidden />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: GASTOS_COLOR }} aria-hidden />
          Gastos
        </span>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={buckets} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="ingresosFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={INGRESOS_COLOR} stopOpacity={0.32} />
                <stop offset="100%" stopColor={INGRESOS_COLOR} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gastosFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GASTOS_COLOR} stopOpacity={0.28} />
                <stop offset="100%" stopColor={GASTOS_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke={GRID_COLOR} vertical={false} />

            <XAxis
              dataKey="label"
              axisLine={{ stroke: AXIS_LINE_COLOR }}
              tickLine={false}
              tick={{ fontSize: 10, fill: MUTED_TEXT }}
              interval={labelStride - 1}
              dy={8}
            />
            <YAxis
              domain={[0, maxValue]}
              ticks={yTicks}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: MUTED_TEXT }}
              tickFormatter={(v: number) => formatCurrencyCompact(v)}
              width={52}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }} />

            <Area
              type="monotone"
              dataKey="ingresos"
              stroke={INGRESOS_COLOR}
              strokeWidth={2}
              fill="url(#ingresosFill)"
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="gastos"
              stroke={GASTOS_COLOR}
              strokeWidth={2}
              fill="url(#gastosFill)"
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
