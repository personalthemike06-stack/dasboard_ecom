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
