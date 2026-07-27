'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Settings, X } from 'lucide-react'
import { DashboardNav } from '@/components/DashboardNav'
import { StoreSelector } from '@/components/StoreSelector'
import { LogoutButton } from '@/components/LogoutButton'
import type { ClientPlan } from '@/lib/plans'

type StoreOption = { id: string; nombre: string }

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-accent text-sm font-bold text-white">
        H
      </div>
      <span className="truncate text-sm font-semibold text-slate-900">Healzyp Analytics</span>
    </div>
  )
}

function SidebarBody({
  clientName,
  storeOptions,
  selectedStoreId,
  atStoreLimit,
  plan,
  onNavigate,
}: {
  clientName: string
  storeOptions: StoreOption[]
  selectedStoreId: string | null
  atStoreLimit: boolean
  plan: ClientPlan
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <Brand />

      <div className="px-3 pb-3">
        <StoreSelector stores={storeOptions} selectedStoreId={selectedStoreId} atStoreLimit={atStoreLimit} />
      </div>

      <div className="mx-3 border-t border-slate-900/[0.06]" />

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <DashboardNav onNavigate={onNavigate} plan={plan} />
      </nav>

      <div className="mx-3 border-t border-slate-900/[0.06]" />

      <div className="space-y-1 px-3 py-3">
        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-900/[0.03] hover:text-slate-900"
        >
          <Settings className="h-4 w-4 shrink-0" strokeWidth={2} />
          Ajustes
        </Link>

        <div className="flex items-center gap-2.5 rounded-lg py-1.5 pl-3 pr-1.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {clientName.charAt(0).toUpperCase() || '?'}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
            {clientName}
          </span>
          <LogoutButton variant="icon" />
        </div>
      </div>
    </div>
  )
}

/**
 * Sidebar fijo del dashboard (sustituye al header + nav horizontal
 * anterior). En lg+ es un <aside> fixed siempre visible; por debajo colapsa
 * a una barra superior con botón de menú que abre el mismo contenido como
 * drawer — misma StoreSelector/DashboardNav/LogoutButton, solo el
 * contenedor cambia entre desktop y móvil.
 */
export function Sidebar({
  clientName,
  storeOptions,
  selectedStoreId,
  atStoreLimit = false,
  plan,
}: {
  clientName: string
  storeOptions: StoreOption[]
  selectedStoreId: string | null
  atStoreLimit?: boolean
  plan: ClientPlan
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Sidebar de escritorio — siempre montado, oculto por CSS por debajo
          de lg para que no haya salto de layout al cruzar el breakpoint. */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] flex-col border-r border-slate-900/[0.06] bg-surface-1 lg:flex"
        aria-label="Navegación principal"
      >
        <SidebarBody
          clientName={clientName}
          storeOptions={storeOptions}
          selectedStoreId={selectedStoreId}
          atStoreLimit={atStoreLimit}
          plan={plan}
        />
      </aside>

      {/* Barra superior móvil/tablet — sustituye al sidebar por debajo de lg. */}
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

      {/* Drawer móvil/tablet */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Cerrar menú de navegación"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/30"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(80vw,var(--sidebar-width))] flex-col bg-surface-1 shadow-xl">
            <div className="flex items-center justify-end px-3 pt-3">
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú de navegación"
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-900/[0.04] hover:text-slate-900"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <div className="-mt-3 flex-1">
              <SidebarBody
                clientName={clientName}
                storeOptions={storeOptions}
                selectedStoreId={selectedStoreId}
                atStoreLimit={atStoreLimit}
                plan={plan}
                onNavigate={() => setOpen(false)}
              />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
