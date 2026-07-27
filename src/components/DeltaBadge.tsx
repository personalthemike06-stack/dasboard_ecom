import { TrendingDown, TrendingUp } from 'lucide-react'
import { STATUS_COLORS } from '@/lib/status-colors'
import type { Delta } from '@/lib/finance'

/**
 * "+12% vs mes pasado" — color = dirección × si subir es bueno para esa
 * métrica (ingresos/beneficio: sí: gastos: no). Nunca reemplaza al número
 * principal, solo lo acompaña.
 */
export function DeltaBadge({ delta, upIsGood }: { delta: Delta | null; upIsGood: boolean }) {
  if (!delta) return null

  if (delta.isNew) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        Nuevo este mes
      </span>
    )
  }

  const isUp = delta.pct >= 0
  const isGood = isUp === upIsGood
  const color = isGood ? STATUS_COLORS.good : STATUS_COLORS.critical
  const Icon = isUp ? TrendingUp : TrendingDown

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ color, backgroundColor: isGood ? '#e7f6e7' : '#fbe4e4' }}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {isUp ? '+' : ''}
      {delta.pct.toFixed(0)}% vs mes pasado
    </span>
  )
}
