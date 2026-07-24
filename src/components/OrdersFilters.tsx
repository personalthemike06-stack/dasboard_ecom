'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

// order_status_enum real (supabase/schema.sql de la tienda, español).
const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'procesando', label: 'Procesando' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'fallido', label: 'Pago fallido' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'reembolsado', label: 'Reembolsado' },
]

const inputClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft'

export function OrdersFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-500" htmlFor="status">
          Estado
        </label>
        <select
          id="status"
          value={searchParams.get('status') ?? ''}
          onChange={(e) => updateParam('status', e.target.value)}
          className={inputClass}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-500" htmlFor="from">
          Desde
        </label>
        <input
          id="from"
          type="date"
          value={searchParams.get('from') ?? ''}
          onChange={(e) => updateParam('from', e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-500" htmlFor="to">
          Hasta
        </label>
        <input
          id="to"
          type="date"
          value={searchParams.get('to') ?? ''}
          onChange={(e) => updateParam('to', e.target.value)}
          className={inputClass}
        />
      </div>

      {(searchParams.get('status') || searchParams.get('from') || searchParams.get('to')) && (
        <button
          onClick={() => router.push(pathname)}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
