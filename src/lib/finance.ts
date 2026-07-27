export type Period = 'day' | 'week' | 'month'

export type PeriodBucket = {
  key: string
  label: string
  ingresos: number
  gastos: number
}

const MONTH_LABELS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day // retrocede hasta el lunes
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function bucketKey(date: Date, period: Period): string {
  if (period === 'day') {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
  }
  if (period === 'week') {
    const start = startOfWeek(date)
    return `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`
  }
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`
}

export function bucketLabel(key: string, period: Period): string {
  if (period === 'month') {
    const [y, m] = key.split('-').map(Number)
    return `${MONTH_LABELS[m - 1]} ${y}`
  }
  const [, m, d] = key.split('-').map(Number)
  if (period === 'week') return `sem. ${pad2(d)}/${pad2(m)}`
  return `${pad2(d)}/${pad2(m)}`
}

/** Devuelve las últimas `count` claves de periodo hasta hoy (incluida), en orden ascendente. */
export function recentBucketKeys(period: Period, count: number, now = new Date()): string[] {
  const keys: string[] = []
  const cursor = new Date(now)
  for (let i = 0; i < count; i++) {
    keys.unshift(bucketKey(cursor, period))
    if (period === 'day') cursor.setDate(cursor.getDate() - 1)
    else if (period === 'week') cursor.setDate(cursor.getDate() - 7)
    else cursor.setMonth(cursor.getMonth() - 1)
  }
  // de-duplicar por si acaso, manteniendo orden
  return Array.from(new Set(keys))
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`
}

export type Delta = { pct: number; isNew: false } | { pct: null; isNew: true }

/**
 * % de cambio respecto al periodo anterior. Sin dato previo (previous = 0)
 * un porcentaje no tiene sentido (sería infinito) — se marca isNew en vez de
 * inventar un número. Si ambos son 0, no hay nada que contar (null).
 */
export function percentDelta(current: number, previous: number): Delta | null {
  if (previous === 0) {
    if (current === 0) return null
    return { pct: null, isNew: true }
  }
  return { pct: ((current - previous) / previous) * 100, isNew: false }
}

export function buildBuckets(
  period: Period,
  count: number,
  ingresosRows: { date: Date; amount: number }[],
  gastosRows: { date: Date; amount: number }[],
  now = new Date()
): PeriodBucket[] {
  const keys = recentBucketKeys(period, count, now)
  const buckets = new Map<string, PeriodBucket>(
    keys.map((key) => [key, { key, label: bucketLabel(key, period), ingresos: 0, gastos: 0 }])
  )

  for (const row of ingresosRows) {
    const key = bucketKey(row.date, period)
    const bucket = buckets.get(key)
    if (bucket) bucket.ingresos += row.amount
  }
  for (const row of gastosRows) {
    const key = bucketKey(row.date, period)
    const bucket = buckets.get(key)
    if (bucket) bucket.gastos += row.amount
  }

  return keys.map((key) => buckets.get(key)!)
}
