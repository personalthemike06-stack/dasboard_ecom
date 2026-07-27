'use client'

import { Suspense } from 'react'
import { Megaphone, Tag, Truck, Wrench } from 'lucide-react'
import { DevtestShell } from '@/components/DevtestShell'
import { FinancePeriodSelector } from '@/components/FinancePeriodSelector'
import { FinanceMetricCards } from '@/components/FinanceMetricCards'
import { ExpenseDrawerProvider } from '@/components/ExpenseDrawer'
import { AddExpenseButton } from '@/components/AddExpenseButton'
import { Reveal } from '@/components/Reveal'
import { formatCurrency, formatDate } from '@/lib/format'
import { percentDelta, type PeriodBucket } from '@/lib/finance'

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
const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  marketing: { bg: '#fce7f3', text: '#db2777' },
  herramientas: { bg: '#dbeafe', text: '#2563eb' },
  envios: { bg: '#ccfbf1', text: '#0d9488' },
  otros: { bg: '#f1f5f9', text: '#64748b' },
}

const MOCK_BUCKETS: PeriodBucket[] = [
  { key: '2025-08', label: 'ago 2025', ingresos: 0, gastos: 0 },
  { key: '2025-09', label: 'sep 2025', ingresos: 0, gastos: 0 },
  { key: '2025-10', label: 'oct 2025', ingresos: 0, gastos: 0 },
  { key: '2025-11', label: 'nov 2025', ingresos: 0, gastos: 0 },
  { key: '2025-12', label: 'dic 2025', ingresos: 0, gastos: 0 },
  { key: '2026-01', label: 'ene 2026', ingresos: 0, gastos: 0 },
  { key: '2026-02', label: 'feb 2026', ingresos: 0, gastos: 0 },
  { key: '2026-03', label: 'mar 2026', ingresos: 0, gastos: 0 },
  { key: '2026-04', label: 'abr 2026', ingresos: 45, gastos: 25 },
  { key: '2026-05', label: 'may 2026', ingresos: 89.98, gastos: 25 },
  { key: '2026-06', label: 'jun 2026', ingresos: 150, gastos: 110 },
  { key: '2026-07', label: 'jul 2026', ingresos: 209.97, gastos: 60 },
]

const MOCK_EXPENSES = [
  { id: '1', fecha: '2026-07-18', categoria: 'marketing', descripcion: 'Ads Instagram', importe: 35 },
  { id: '2', fecha: '2026-07-10', categoria: 'herramientas', descripcion: 'Supabase Pro', importe: 25 },
  { id: '3', fecha: '2026-06-28', categoria: 'envios', descripcion: 'Etiquetas de envío', importe: 60 },
  { id: '4', fecha: '2026-05-14', categoria: 'herramientas', descripcion: 'Dominio anual', importe: 12 },
]

const current = MOCK_BUCKETS[MOCK_BUCKETS.length - 1]
const previous = MOCK_BUCKETS[MOCK_BUCKETS.length - 2]
const beneficioMes = current.ingresos - current.gastos
const beneficioAnterior = previous.ingresos - previous.gastos

const ingresosDelta = percentDelta(current.ingresos, previous.ingresos)
const gastosDelta = percentDelta(current.gastos, previous.gastos)
const beneficioDelta = percentDelta(beneficioMes, beneficioAnterior)

const beneficioSpark = MOCK_BUCKETS.map((b) => b.ingresos - b.gastos)

export default function DevTestFinancePopulatedPage() {
  return (
    <DevtestShell currentPath="/dashboard/finance">
      <ExpenseDrawerProvider storeId="devtest-store-id">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">Estado financiero</h2>
              <p className="text-sm text-slate-500">Ingresos de pedidos pagados menos gastos manuales</p>
            </div>
            <div className="flex items-center gap-3">
              <Suspense fallback={null}>
                <FinancePeriodSelector />
              </Suspense>
              <AddExpenseButton />
            </div>
          </div>

          <FinanceMetricCards
            ingresosMes={current.ingresos}
            gastosMes={current.gastos}
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
            <ul className="divide-y divide-slate-50 px-5">
              {MOCK_EXPENSES.map((e) => {
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
                      {formatCurrency(e.importe)}
                    </p>
                  </li>
                )
              })}
            </ul>
          </Reveal>
        </div>
      </ExpenseDrawerProvider>
    </DevtestShell>
  )
}
