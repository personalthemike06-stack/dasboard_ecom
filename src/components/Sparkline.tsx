'use client'

import { useId } from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

/** Mini tendencia dentro de una tarjeta de métrica — sin ejes, sin grid. */
export function Sparkline({
  data,
  color,
  height = 'h-10',
}: {
  data: number[]
  color: string
  height?: string
}) {
  const gradientId = useId()
  const points = data.map((v, i) => ({ i, v }))

  return (
    <div className={`${height} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 1, bottom: 0, left: 1 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            isAnimationActive
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
