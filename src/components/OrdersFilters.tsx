'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { formatDate } from '@/lib/format'

// Subconjunto deliberado de order_status_enum (pedido explícito del rediseño:
// pills solo para los 4 estados más habituales) — el resto de estados
// (procesando/enviado/entregado/cancelado/reembolsado) no tienen filtro
// dedicado aquí. Si status trae otro valor por URL directa, ninguna pill se
// marca activa pero el filtro real (searchParams) se sigue aplicando igual.
const STATUS_PILLS = [
  { value: '', label: 'Todos' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'fallido', label: 'Fallido' },
]

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft'

export function OrdersFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [dateOpen, setDateOpen] = useState(false)

  const status = searchParams.get('status') ?? ''
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const [fromDraft, setFromDraft] = useState(from)
  const [toDraft, setToDraft] = useState(to)

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function applyDate() {
    updateParams({ from: fromDraft || null, to: toDraft || null })
    setDateOpen(false)
  }

  function clearDate() {
    setFromDraft('')
    setToDraft('')
    updateParams({ from: null, to: null })
    setDateOpen(false)
  }

  const dateLabel =
    from || to ? `${from ? formatDate(from) : '…'} – ${to ? formatDate(to) : '…'}` : 'Todas las fechas'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 p-1">
        {STATUS_PILLS.map((opt) => {
          const active = opt.value === status
          return (
            <button
              key={opt.value || 'all'}
              type="button"
              onClick={() => updateParams({ status: opt.value || null })}
              className={
                active
                  ? 'bg-gradient-accent rounded-full px-3 py-1.5 text-sm font-semibold text-white'
                  : 'rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900'
              }
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setDateOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <Calendar className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
          {dateLabel}
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
        </button>

        {dateOpen && (
          <>
            <button
              aria-label="Cerrar selector de fechas"
              onClick={() => setDateOpen(false)}
              className="fixed inset-0 z-10"
            />
            <div className="absolute left-0 z-20 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-500" htmlFor="orders-from">
                    Desde
                  </label>
                  <input
                    id="orders-from"
                    type="date"
                    value={fromDraft}
                    onChange={(e) => setFromDraft(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-500" htmlFor="orders-to">
                    Hasta
                  </label>
                  <input
                    id="orders-to"
                    type="date"
                    value={toDraft}
                    onChange={(e) => setToDraft(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={clearDate}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={applyDate}
                  className="bg-gradient-accent rounded-md px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-105"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
