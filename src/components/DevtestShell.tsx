'use client'

import { DashboardNav } from '@/components/DashboardNav'

/**
 * Réplica de src/app/dashboard/layout.tsx sin el chequeo de sesión admin —
 * solo para las páginas /devtest, que necesitan verse como el dashboard real
 * (header + nav) pero renderizan datos simulados, sin login.
 */
export function DevtestShell({
  currentPath,
  children,
}: {
  currentPath: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-slate-900">
      <header className="px-6 pt-6">
        <div className="flex items-center justify-between pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-accent text-sm font-bold text-white">
              H
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Healzyp Analytics</h1>
              <p className="text-xs text-slate-400">admin@healzyp.com (datos simulados)</p>
            </div>
          </div>
          <button className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
            Cerrar sesión
          </button>
        </div>
      </header>
      <div className="px-6 pb-6">
        <div className="card inline-flex p-1.5">
          <DashboardNav currentPath={currentPath} />
        </div>
      </div>
      <main className="px-6 pb-6">{children}</main>
    </div>
  )
}
