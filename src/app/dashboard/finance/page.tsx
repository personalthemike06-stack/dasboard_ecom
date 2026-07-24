import { Megaphone, Tag, Truck, Wrench } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FinancePeriodSelector } from '@/components/FinancePeriodSelector'
import { RevenueExpenseChart } from '@/components/RevenueExpenseChart'
import { FinanceMetricCards } from '@/components/FinanceMetricCards'
import { NewExpenseForm } from '@/components/NewExpenseForm'
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

const BUCKET_COUNT: Record<Period, number> = { day: 30, week: 12, month: 12 }
const SPARKLINE_POINTS = 8

function isValidPeriod(value: string | undefined): value is Period {
  return value === 'day' || value === 'week' || value === 'month'
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: periodParam } = await searchParams
  const period: Period = isValidPeriod(periodParam) ? periodParam : 'month'

  const supabase = await createClient()
  const now = new Date()
  const since = new Date(now)
  since.setMonth(since.getMonth() - 12)
  const sinceStr = since.toISOString().slice(0, 10)

  // Ingresos = orders.total donde estado = 'pagado' (order_status_enum real,
  // en español). No hay columna payment_status separada ni paid_at: la
  // tienda usa fecha_actualizacion como fecha de pago (mismo criterio que
  // OrderTimeline en el repo de la tienda — se actualiza al pasar a 'pagado').
  const [{ data: orders, error: ordersError }, { data: expenses, error: expensesError }] =
    await Promise.all([
      supabase
        .from('orders')
        .select('total, fecha_actualizacion')
        .eq('estado', 'pagado')
        .gte('fecha_actualizacion', `${sinceStr}T00:00:00`),
      supabase
        .from('dashboard_expenses')
        .select('id, fecha, importe, categoria, descripcion')
        .gte('fecha', sinceStr)
        .order('fecha', { ascending: false }),
    ])

  const ingresosRows = (orders ?? []).map((o) => ({
    date: new Date(o.fecha_actualizacion),
    amount: Number(o.total),
  }))
  const gastosRows = (expenses ?? []).map((e) => ({
    date: new Date(`${e.fecha}T00:00:00`),
    amount: Number(e.importe),
  }))

  const buckets = buildBuckets(period, BUCKET_COUNT[period], ingresosRows, gastosRows, now)

  // Meses de calendario (para las tarjetas y sus sparklines) — siempre
  // independientes del selector día/semana/mes del gráfico grande.
  const monthlyBuckets = buildBuckets('month', SPARKLINE_POINTS, ingresosRows, gastosRows, now)
  const ingresosSpark = monthlyBuckets.map((b) => b.ingresos)
  const gastosSpark = monthlyBuckets.map((b) => b.gastos)

  const currentMonthKey = monthKey(now)
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const previousMonthKey = monthKey(previousMonth)

  const sumForMonth = (rows: { date: Date; amount: number }[], key: string) =>
    rows.filter((r) => monthKey(r.date) === key).reduce((s, r) => s + r.amount, 0)

  const ingresosMes = sumForMonth(ingresosRows, currentMonthKey)
  const gastosMes = sumForMonth(gastosRows, currentMonthKey)
  const beneficioMes = ingresosMes - gastosMes

  const ingresosMesAnterior = sumForMonth(ingresosRows, previousMonthKey)
  const gastosMesAnterior = sumForMonth(gastosRows, previousMonthKey)
  const beneficioMesAnterior = ingresosMesAnterior - gastosMesAnterior

  const ingresosDelta = percentDelta(ingresosMes, ingresosMesAnterior)
  const gastosDelta = percentDelta(gastosMes, gastosMesAnterior)
  const beneficioDelta = percentDelta(beneficioMes, beneficioMesAnterior)

  const hasError = ordersError || expensesError
  const expenseRows = expenses ?? []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Estado financiero</h2>
          <p className="text-sm text-slate-500">Ingresos de pedidos pagados menos gastos manuales</p>
        </div>
        <FinancePeriodSelector />
      </div>

      {hasError && (
        <p className="text-sm" style={{ color: STATUS_COLORS.critical }}>
          Error leyendo datos financieros: {ordersError?.message ?? expensesError?.message}. Aplica
          database/dashboard-rls-002.sql.
        </p>
      )}

      <FinanceMetricCards
        ingresosMes={ingresosMes}
        gastosMes={gastosMes}
        beneficioMes={beneficioMes}
        ingresosDelta={ingresosDelta}
        gastosDelta={gastosDelta}
        beneficioDelta={beneficioDelta}
        ingresosSpark={ingresosSpark}
        gastosSpark={gastosSpark}
      />

      <Reveal delay={0.1} className="card p-4">
        <RevenueExpenseChart buckets={buckets} />
      </Reveal>

      <Reveal delay={0.15} className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              <th className="px-4 py-2">Periodo</th>
              <th className="px-4 py-2">Ingresos</th>
              <th className="px-4 py-2">Gastos</th>
              <th className="px-4 py-2">Beneficio</th>
            </tr>
          </thead>
          <tbody>
            {[...buckets].reverse().map((b, i) => {
              const beneficio = b.ingresos - b.gastos
              return (
                <tr
                  key={b.key}
                  className="border-b border-slate-50 last:border-0"
                  style={{ backgroundColor: i % 2 === 1 ? '#fafafa' : undefined }}
                >
                  <td className="px-4 py-2 text-slate-600">{b.label}</td>
                  <td className="px-4 py-2 tabular-nums text-slate-900">{formatCurrency(b.ingresos)}</td>
                  <td className="px-4 py-2 tabular-nums text-slate-900">{formatCurrency(b.gastos)}</td>
                  <td
                    className="px-4 py-2 font-medium tabular-nums"
                    style={{ color: beneficio >= 0 ? STATUS_COLORS.good : STATUS_COLORS.critical }}
                  >
                    {formatCurrency(beneficio)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <Reveal delay={0.2} className="card p-4">
          <h3 className="text-sm font-semibold text-slate-900">Añadir gasto</h3>
          <div className="mt-3">
            <NewExpenseForm />
          </div>
        </Reveal>

        <Reveal delay={0.25} className="card overflow-hidden">
          {expenseRows.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Importe</th>
                </tr>
              </thead>
              <tbody>
                {expenseRows.map((e, i) => {
                  const CategoryIcon = CATEGORY_ICONS[e.categoria] ?? Tag
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-slate-50 last:border-0"
                      style={{ backgroundColor: i % 2 === 1 ? '#fafafa' : undefined }}
                    >
                      <td className="px-4 py-3 text-slate-600">{formatDate(e.fecha)}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <CategoryIcon className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
                          {CATEGORY_LABELS[e.categoria] ?? e.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{e.descripcion ?? '—'}</td>
                      <td className="px-4 py-3 font-medium tabular-nums text-slate-900">
                        {formatCurrency(Number(e.importe))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {expenseRows.length === 0 && !expensesError && <ExpensesEmptyState />}
        </Reveal>
      </div>
    </div>
  )
}
