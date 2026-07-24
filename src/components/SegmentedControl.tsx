'use client'

import { motion } from 'motion/react'

/**
 * Grupo de opciones tipo "segmented control" con highlight que desliza
 * entre opciones (mismo patrón que el pill activo de DashboardNav) en vez
 * de un cambio de color instantáneo. `layoutId` debe ser único por
 * instancia — dos controles montados a la vez con el mismo layoutId
 * competirían por la misma animación compartida.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  layoutId: string
}) {
  return (
    <div className="card inline-flex items-center gap-0.5 p-1">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              active
                ? 'relative rounded-lg px-3 py-1.5 text-sm font-semibold text-white'
                : 'relative rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900'
            }
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="bg-gradient-accent absolute inset-0 rounded-lg"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
