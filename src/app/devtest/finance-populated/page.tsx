'use client'

import { Suspense } from 'react'
import { Megaphone, Tag, Truck, Wrench } from 'lucide-react'
import { DevtestShell } from '@/components/DevtestShell'
import { FinancePeriodSelector } from '@/components/FinancePeriodSelector'
import { RevenueExpenseChart } from '@/components/RevenueExpenseChart'
import { FinanceMetricCards } from '@/components/FinanceMetricCards'
import { NewExpenseForm } from '@/components/NewExpenseForm'
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

const ingresosSpark = MOCK_BUCKETS.slice(-8).map((b) => b.ingresos)
const gastosSpark = MOCK_BUCKETS.slice(-8).map((b) => b.gastos)

export default function DevTestFinancePopulatedPage() {
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
                {MOCK_EXPENSES.map((e, i) => {
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
                          {CATEGORY_LABELS[e.categoria]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{e.descripcion}</td>
                      <td className="px-4 py-3 font-medium tabular-nums text-slate-900">
                        {formatCurrency(e.importe)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Reveal>
        </div>
      </div>
    </DevtestShell>
  )
}
