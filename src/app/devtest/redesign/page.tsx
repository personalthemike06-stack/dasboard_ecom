'use client'

import { PackageSearch, Receipt, TrendingUp, Wallet } from 'lucide-react'
import { DashboardNav } from '@/components/DashboardNav'
import { StatusBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/EmptyState'
import { RevenueExpenseChart } from '@/components/RevenueExpenseChart'
import { STATUS_COLORS } from '@/lib/status-colors'
import { formatCurrency } from '@/lib/format'
import type { PeriodBucket } from '@/lib/finance'

// Todo en cero a propósito: es exactamente el caso que producía el eje
// absurdo ("1€, 0,8€, 0,5€") antes del fix.
const ZERO_BUCKETS: PeriodBucket[] = [
  { key: '2026-02', label: 'feb 2026', ingresos: 0, gastos: 0 },
  { key: '2026-03', label: 'mar 2026', ingresos: 0, gastos: 0 },
  { key: '2026-04', label: 'abr 2026', ingresos: 0, gastos: 0 },
  { key: '2026-05', label: 'may 2026', ingresos: 0, gastos: 0 },
  { key: '2026-06', label: 'jun 2026', ingresos: 0, gastos: 0 },
  { key: '2026-07', label: 'jul 2026', ingresos: 0, gastos: 0 },
]

export default function RedesignGalleryPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="card p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Navegación
          </p>
          <DashboardNav />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft">
                <TrendingUp className="h-4 w-4 text-accent" strokeWidth={2} />
              </span>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Ingresos (mes actual)
              </p>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
              {formatCurrency(0)}
            </p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                <Receipt className="h-4 w-4 text-slate-500" strokeWidth={2} />
              </span>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Gastos (mes actual)
              </p>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
              {formatCurrency(0)}
            </p>
          </div>
          <div className="card p-5 ring-1 ring-slate-900/5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: '#e7f6e7' }}>
                <Wallet className="h-4 w-4" style={{ color: STATUS_COLORS.good }} strokeWidth={2} />
              </span>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Beneficio (mes actual)
              </p>
            </div>
            <p className="mt-3 text-4xl font-bold tabular-nums" style={{ color: STATUS_COLORS.good }}>
              {formatCurrency(0)}
            </p>
          </div>
        </div>

        <div className="card p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Gráfico financiero sin datos (eje arreglado)
          </p>
          <RevenueExpenseChart buckets={ZERO_BUCKETS} />
        </div>

        <div className="card p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Badges de estado
          </p>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label="Pendiente" tone="neutral" />
            <StatusBadge label="Pagado" tone="good" />
            <StatusBadge label="Procesando" tone="warning" />
            <StatusBadge label="Reembolsado" tone="serious" />
            <StatusBadge label="Cancelado" tone="critical" />
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody />
          </table>
          <EmptyState
            icon={PackageSearch}
            title="Sin pedidos todavía"
            description="Los pedidos de la tienda aparecerán aquí en cuanto entren."
          />
        </div>
      </div>
    </div>
  )
}
