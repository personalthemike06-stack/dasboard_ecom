export type DailyVisitors = { day: string; label: string; visitors: number }

const DAY_LABEL = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit' })

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Rellena todos los días entre from/to (incluidos ambos extremos) con 0
 * visitantes por defecto, y superpone las filas reales que sí devolvió
 * dashboard_daily_visitors — mismo patrón que buildBuckets en lib/finance.ts:
 * la función SQL solo devuelve días con actividad, así que sin este relleno
 * el gráfico tendría huecos en vez de una línea continua en 0.
 */
export function buildDailyVisitorSeries(
  rpcRows: { day: string; visitors: number }[],
  from: Date,
  to: Date
): DailyVisitors[] {
  const byDay = new Map(rpcRows.map((r) => [r.day, Number(r.visitors)]))
  const days: DailyVisitors[] = []
  const cursor = new Date(from)
  cursor.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(0, 0, 0, 0)

  while (cursor <= end) {
    const key = dayKey(cursor)
    days.push({
      day: key,
      label: DAY_LABEL.format(cursor),
      visitors: byDay.get(key) ?? 0,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

export type VisitorBucket = { key: string; label: string; visitors: number }

const MAX_DAILY_BARS = 30

/**
 * Agrupa la serie diaria en "barras" para el gráfico tipo calendario: un día
 * por barra hasta MAX_DAILY_BARS; a partir de ahí (rango "Personalizado"
 * amplio) agrupa en semanas de 7 días para no acabar con decenas de barras
 * demasiado finas para leerse.
 */
export function buildVisitorChartBuckets(days: DailyVisitors[]): VisitorBucket[] {
  if (days.length <= MAX_DAILY_BARS) {
    return days.map((d) => ({ key: d.day, label: d.label, visitors: d.visitors }))
  }

  const buckets: VisitorBucket[] = []
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7)
    const visitors = chunk.reduce((sum, d) => sum + d.visitors, 0)
    const first = chunk[0]
    const last = chunk[chunk.length - 1]
    const label = first.day === last.day ? first.label : `${first.label}–${last.label}`
    buckets.push({ key: first.day, label, visitors })
  }
  return buckets
}
