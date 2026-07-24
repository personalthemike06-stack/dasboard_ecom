'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DailyVisitors } from '@/lib/visitors'
import { niceAxisScale } from '@/lib/chart-scale'

const VISITORS_COLOR = '#3b82f6'
const VISITORS_COLOR_SOFT = '#34d399'
const GRID_COLOR = '#eef2f6'
const AXIS_LINE_COLOR = '#e2e8f0'
const MUTED_TEXT = '#94a3b8'
const MIN_AXIS_MAX = 10

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: DailyVisitors }[]
}) {
  if (!active || !payload?.length) return null
  const day = payload[0].payload

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-lg shadow-slate-900/5">
      <p className="font-semibold text-slate-900">{day.label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-slate-600">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: VISITORS_COLOR }} aria-hidden />
        Visitantes
        <span className="ml-auto font-medium tabular-nums text-slate-900">{day.visitors}</span>
      </p>
    </div>
  )
}

export function VisitorsChart({ days }: { days: DailyVisitors[] }) {
  const rawMax = Math.max(0, ...days.map((d) => d.visitors))
  const { maxValue, ticks } = niceAxisScale(rawMax, MIN_AXIS_MAX)
  const labelStride = Math.max(1, Math.ceil(days.length / 10))

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={days} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="visitorsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={VISITORS_COLOR} stopOpacity={0.32} />
              <stop offset="65%" stopColor={VISITORS_COLOR_SOFT} stopOpacity={0.14} />
              <stop offset="100%" stopColor={VISITORS_COLOR_SOFT} stopOpacity={0.02} />
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
            ticks={ticks}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: MUTED_TEXT }}
            width={32}
            allowDecimals={false}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }} />

          <Area
            type="monotone"
            dataKey="visitors"
            stroke={VISITORS_COLOR}
            strokeWidth={2}
            fill="url(#visitorsFill)"
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
