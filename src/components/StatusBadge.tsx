import { STATUS_COLORS, STATUS_SOFT_COLORS, type StatusTone } from '@/lib/status-colors'

/**
 * Nunca solo color: icono (punto) + etiqueta de texto, para que el estado
 * se lea aunque no se distingan los tonos (daltonismo, escala de grises).
 */
export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-slate-700"
      style={{ backgroundColor: STATUS_SOFT_COLORS[tone] }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: STATUS_COLORS[tone] }}
        aria-hidden
      />
      {label}
    </span>
  )
}
