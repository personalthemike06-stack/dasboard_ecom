'use client'

import { Suspense } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { DevtestShell } from '@/components/DevtestShell'
import { FinancePeriodSelector } from '@/components/FinancePeriodSelector'
import { FinanceMetricCards } from '@/components/FinanceMetricCards'
import { ExpenseDrawerProvider } from '@/components/ExpenseDrawer'
import { AddExpenseButton } from '@/components/AddExpenseButton'
import { ExpensesEmptyState } from '@/components/ExpensesEmptyState'
import { Reveal } from '@/components/Reveal'
import { STATUS_COLORS } from '@/lib/status-colors'
import { percentDelta, type PeriodBucket } from '@/lib/finance'

// Escenario "tienda joven, pocos pedidos todavía" — el caso real que
// describiste: casi todo en 0€ salvo un par de meses con algo de actividad,
// y de momento ningún gasto registrado.
const MOCK_BUCKETS: PeriodBucket[] = [
  { key: '2025-08', label: 'ago 2025', ingresos: 0, gastos: 0 },
  { key: '2025-09', label: 'sep 2025', ingresos: 0, gastos: 0 },
  { key: '2025-10', label: 'oct 2025', ingresos: 0, gastos: 0 },
  { key: '2025-11', label: 'nov 2025', ingresos: 0, gastos: 0 },
  { key: '2025-12', label: 'dic 2025', ingresos: 0, gastos: 0 },
  { key: '2026-01', label: 'ene 2026', ingresos: 0, gastos: 0 },
  { key: '2026-02', label: 'feb 2026', ingresos: 0, gastos: 0 },
  { key: '2026-03', label: 'mar 2026', ingresos: 0, gastos: 0 },
  { key: '2026-04', label: 'abr 2026', ingresos: 0, gastos: 0 },
  { key: '2026-05', label: 'may 2026', ingresos: 0, gastos: 0 },
  { key: '2026-06', label: 'jun 2026', ingresos: 150, gastos: 0 },
  { key: '2026-07', label: 'jul 2026', ingresos: 89.98, gastos: 0 },
]

const current = MOCK_BUCKETS[MOCK_BUCKETS.length - 1]
const previous = MOCK_BUCKETS[MOCK_BUCKETS.length - 2]
const beneficioMes = current.ingresos - current.gastos
const beneficioAnterior = previous.ingresos - previous.gastos

const ingresosDelta = percentDelta(current.ingresos, previous.ingresos)
const gastosDelta = percentDelta(current.gastos, previous.gastos)
const beneficioDelta = percentDelta(beneficioMes, beneficioAnterior)

const beneficioSpark = MOCK_BUCKETS.map((b) => b.ingresos - b.gastos)

export default function DevTestFinancePage() {
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
            <ExpensesEmptyState />
          </Reveal>

          {/* No es interactivo: solo una vista estática del banner que
              NewExpenseForm muestra tras un guardado real (no se puede probar
              el guardado real aquí, sin sesión admin la escritura la bloquea RLS). */}
          <div className="card max-w-sm p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Vista previa: confirmación tras guardar
            </p>
            <p
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium"
              style={{ color: STATUS_COLORS.good, backgroundColor: '#e7f6e7' }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
              Gasto añadido correctamente.
            </p>
          </div>
        </div>
      </ExpenseDrawerProvider>
    </DevtestShell>
  )
}
