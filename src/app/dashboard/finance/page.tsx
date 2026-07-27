import { Megaphone, Tag, Truck, Wrench } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSelectedStore } from '@/lib/stores'
import { getFinanceSeries } from '@/lib/store-api'
import { NoStoreConnected } from '@/components/NoStoreConnected'
import { StoreConnectionError } from '@/components/StoreConnectionError'
import { FinancePeriodSelector } from '@/components/FinancePeriodSelector'
import { FinanceMetricCards } from '@/components/FinanceMetricCards'
import { ExpenseDrawerProvider } from '@/components/ExpenseDrawer'
import { AddExpenseButton } from '@/components/AddExpenseButton'
import { ExpensesEmptyState } from '@/components/ExpensesEmptyState'
import { Reveal } from '@/components/Reveal'
import { STATUS_COLORS } from '@/lib/status-colors'
import { formatCurrency, formatDate } from '@/lib/format'
import { buildBuckets, monthKey, percentDelta, type Period } from '@/lib/finance'

export const dynamic = 'force-dynamic'

const CATEGORY_LABELS: Record<string, string> = {
  marketing: 'Marketing',
  herramientas: 'Herramientas',
  envios: 'Envíos',
  otros: 'Otros',
}

const CATEGORY_ICONS: Record<string, typeof Megaphone> = {
  marketing: Megaphone,
  herramientas: Wrench,
  envios: Truck,
  otros: Tag,
}

// Círculo de icono por categoría — colores suaves distintos entre sí, no
// ligados a STATUS_COLORS (esto no son estados, son categorías).
const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  marketing: { bg: '#fce7f3', text: '#db2777' },
  herramientas: { bg: '#dbeafe', text: '#2563eb' },
  envios: { bg: '#ccfbf1', text: '#0d9488' },
  otros: { bg: '#f1f5f9', text: '#64748b' },
}

const BUCKET_COUNT: Record<Period, number> = { day: 30, week: 12, month: 12 }

function isValidPeriod(value: string | undefined): value is Period {
  return value === 'day' || value === 'week' || value === 'month'
}

function seriesToRows(series: { bucket: string; ingresos: number }[]) {
  // Sin "Z": misma técnica que gastosRows más abajo, para que
  // getFullYear/getMonth/getDate lean el mismo día que manda el bucket sin
  // desplazarse por la zona horaria local de quien ejecuta esto.
  return series.map((row) => ({ date: new Date(`${row.bucket}T00:00:00`), amount: row.ingresos }))
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: periodParam } = await searchParams
  const period: Period = isValidPeriod(periodParam) ? periodParam : 'month'

  const store = await getSelectedStore()
  if (!store) return <NoStoreConnected />

  const now = new Date()
  const since = new Date(now)
  since.setMonth(since.getMonth() - 12)
  const sinceStr = since.toISOString().slice(0, 10)
  const todayStr = now.toISOString().slice(0, 10)

  const supabase = await createClient()

  // Ingresos = pedidos pagados, agregados por la propia tienda vía
  // /api/dashboard/finance-series (ver src/lib/store-api.ts) — ya no se lee
  // `orders` directamente de esta Supabase. Se pide dos veces: una a la
  // resolución elegida en el selector de periodo (para la tendencia del
  // hero) y otra siempre en 'month' (para los totales de mes actual/
  // anterior, que no dependen del selector). Gastos manuales siguen en la
  // Supabase de este dashboard, ahora acotados a la tienda seleccionada.
  const [seriesResult, monthlySeriesResult, { data: expenses, error: expensesError }] =
    await Promise.all([
      getFinanceSeries(store, { period, from: sinceStr, to: todayStr }),
      getFinanceSeries(store, { period: 'month', from: sinceStr, to: todayStr }),
      supabase
        .from('dashboard_expenses')
        .select('id, fecha, importe, categoria, descripcion')
        .eq('store_id', store.id)
        .gte('fecha', sinceStr)
        .order('fecha', { ascending: false }),
    ])

  if (!seriesResult.ok) return <StoreConnectionError message={seriesResult.error} />
  if (!monthlySeriesResult.ok) return <StoreConnectionError message={monthlySeriesResult.error} />

  const ingresosRows = seriesToRows(seriesResult.data.series)
  const ingresosRowsMonthly = seriesToRows(monthlySeriesResult.data.series)
  const gastosRows = (expenses ?? []).map((e) => ({
    date: new Date(`${e.fecha}T00:00:00`),
    amount: Number(e.importe),
  }))

  // Buckets a la resolución elegida — solo alimentan la tendencia embebida
  // del hero (beneficioSpark), no los totales de mes.
  const buckets = buildBuckets(period, BUCKET_COUNT[period], ingresosRows, gastosRows, now)
  const beneficioSpark = buckets.map((b) => b.ingresos - b.gastos)

  const currentMonthKey = monthKey(now)
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const previousMonthKey = monthKey(previousMonth)

  const sumForMonth = (rows: { date: Date; amount: number }[], key: string) =>
    rows.filter((r) => monthKey(r.date) === key).reduce((s, r) => s + r.amount, 0)

  const ingresosMes = sumForMonth(ingresosRowsMonthly, currentMonthKey)
  const gastosMes = sumForMonth(gastosRows, currentMonthKey)
  const beneficioMes = ingresosMes - gastosMes

  const ingresosMesAnterior = sumForMonth(ingresosRowsMonthly, previousMonthKey)
  const gastosMesAnterior = sumForMonth(gastosRows, previousMonthKey)
  const beneficioMesAnterior = ingresosMesAnterior - gastosMesAnterior

  const ingresosDelta = percentDelta(ingresosMes, ingresosMesAnterior)
  const gastosDelta = percentDelta(gastosMes, gastosMesAnterior)
  const beneficioDelta = percentDelta(beneficioMes, beneficioMesAnterior)

  const expenseRows = expenses ?? []

  return (
    <ExpenseDrawerProvider storeId={store.id}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Estado financiero</h2>
            <p className="text-sm text-slate-500">Ingresos de pedidos pagados menos gastos manuales</p>
          </div>
          <div className="flex items-center gap-3">
            <FinancePeriodSelector />
            <AddExpenseButton />
          </div>
        </div>

        {expensesError && (
          <p className="text-sm" style={{ color: STATUS_COLORS.critical }}>
            Error leyendo gastos: {expensesError.message}. Aplica
            database/saas-schema-002-expenses.sql en la Supabase del dashboard.
          </p>
        )}

        <FinanceMetricCards
          ingresosMes={ingresosMes}
          gastosMes={gastosMes}
          beneficioMes={beneficioMes}
          ingresosDelta={ingresosDelta}
          gastosDelta={gastosDelta}
          beneficioDelta={beneficioDelta}
          beneficioSpark={beneficioSpark}
        />

        <Reveal delay={0.15} className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Gastos recientes</h3>
          </div>

          {expenseRows.length > 0 && (
            <ul className="divide-y divide-slate-50 px-5">
              {expenseRows.map((e) => {
                const CategoryIcon = CATEGORY_ICONS[e.categoria] ?? Tag
                const style = CATEGORY_STYLES[e.categoria] ?? CATEGORY_STYLES.otros
                const label = CATEGORY_LABELS[e.categoria] ?? e.categoria
                return (
                  <li key={e.id} className="flex items-center gap-3 py-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: style.bg }}
                    >
                      <CategoryIcon className="h-4 w-4" style={{ color: style.text }} strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {e.descripcion || label}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(e.fecha)} · {label}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                      {formatCurrency(Number(e.importe))}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}

          {expenseRows.length === 0 && !expensesError && <ExpensesEmptyState />}
        </Reveal>
      </div>
    </ExpenseDrawerProvider>
  )
}
