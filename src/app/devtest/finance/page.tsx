'use client'

import { Suspense } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { DevtestShell } from '@/components/DevtestShell'
import { FinancePeriodSelector } from '@/components/FinancePeriodSelector'
import { RevenueExpenseChart } from '@/components/RevenueExpenseChart'
import { FinanceMetricCards } from '@/components/FinanceMetricCards'
import { NewExpenseForm } from '@/components/NewExpenseForm'
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

const ingresosSpark = MOCK_BUCKETS.slice(-8).map((b) => b.ingresos)
const gastosSpark = MOCK_BUCKETS.slice(-8).map((b) => b.gastos)

export default function DevTestFinancePage() {
  return (
    <DevtestShell currentPath="/dashboard/finance">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Estado financiero</h2>
            <p className="text-sm text-slate-500">Ingresos de pedidos pagados menos gastos manuales</p>
          </div>
          <Suspense fallback={null}>
            <FinancePeriodSelector />
          </Suspense>
        </div>

        <FinanceMetricCards
          ingresosMes={current.ingresos}
          gastosMes={current.gastos}
          beneficioMes={beneficioMes}
          ingresosDelta={ingresosDelta}
          gastosDelta={gastosDelta}
          beneficioDelta={beneficioDelta}
          ingresosSpark={ingresosSpark}
          gastosSpark={gastosSpark}
        />

        <Reveal delay={0.1} className="card p-4">
          <RevenueExpenseChart buckets={MOCK_BUCKETS} />
        </Reveal>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
          <Reveal delay={0.15} className="card p-4">
            <h3 className="text-sm font-semibold text-slate-900">Añadir gasto</h3>
            <div className="mt-3">
              <NewExpenseForm />
            </div>
          </Reveal>

          <Reveal delay={0.2} className="card overflow-hidden">
            <ExpensesEmptyState />
          </Reveal>
        </div>

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
    </DevtestShell>
  )
}
