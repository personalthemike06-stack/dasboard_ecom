'use client'

import { useState } from 'react'
import { ChevronDown, LogOut, Menu, Settings, Store as StoreIcon } from 'lucide-react'
import { DashboardNav } from '@/components/DashboardNav'

/**
 * Réplica del sidebar real (src/components/Sidebar.tsx) sin el chequeo de
 * sesión admin ni las escrituras reales (cookie de tienda, signOut) — solo
 * para las páginas /devtest, que necesitan verse como el dashboard real pero
 * renderizan datos simulados, sin login.
 */
export function DevtestShell({
  currentPath,
  children,
}: {
  currentPath: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  const body = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-accent text-sm font-bold text-white">
          H
        </div>
        <span className="truncate text-sm font-semibold text-slate-900">Healzyp Analytics</span>
      </div>

      <div className="px-3 pb-3">
        <div className="relative">
          <span className="pointer-events-none absolute left-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md bg-accent-soft">
            <StoreIcon className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
          </span>
          <div className="w-full truncate rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-7 text-sm font-medium text-slate-900">
            Tienda de prueba
          </div>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            strokeWidth={2}
          />
        </div>
      </div>

      <div className="mx-3 border-t border-slate-900/[0.06]" />

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <DashboardNav currentPath={currentPath} onNavigate={() => setOpen(false)} />
      </nav>

      <div className="mx-3 border-t border-slate-900/[0.06]" />

      <div className="space-y-1 px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500">
          <Settings className="h-4 w-4 shrink-0" strokeWidth={2} />
          Ajustes
        </div>
        <div className="flex items-center gap-2.5 rounded-lg py-1.5 pl-3 pr-1.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            A
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
            admin@healzyp.com (simulado)
          </span>
          <button
            aria-label="Cerrar sesión"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-900/[0.04] hover:text-slate-700"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] flex-col border-r border-slate-900/[0.06] bg-surface-1 lg:flex">
        {body}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-900/[0.06] bg-surface-1 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-accent text-xs font-bold text-white">
            H
          </div>
          <span className="text-sm font-semibold text-slate-900">Healzyp Analytics</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú de navegación"
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-900/[0.04] hover:text-slate-900"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Cerrar menú de navegación"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/30"
          />
          <aside className="absolute inset-y-0 left-0 w-[min(80vw,var(--sidebar-width))] bg-surface-1 shadow-xl">
            {body}
          </aside>
        </div>
      )}

      <main className="px-6 py-6 lg:pl-[calc(var(--sidebar-width)+1.5rem)]">{children}</main>
    </div>
  )
}
