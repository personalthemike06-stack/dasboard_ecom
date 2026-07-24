'use client'

import { Receipt } from 'lucide-react'

/**
 * No reutiliza <EmptyState> (Server Component sin 'use client'): el botón
 * necesita un onClick, y una función no se puede pasar como prop desde un
 * Server Component — así que este componente entero vive en el cliente,
 * con su propio icono importado localmente en vez de recibido por prop.
 */
export function ExpensesEmptyState() {
  function focusForm() {
    const el = document.getElementById('importe')
    el?.focus()
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
        <Receipt className="h-6 w-6 text-accent" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">Aún no has registrado gastos</p>
        <p className="mt-0.5 text-xs text-slate-400">
          Añádelos desde el formulario de la izquierda para ver el beneficio real.
        </p>
      </div>
      <button
        onClick={focusForm}
        className="bg-gradient-accent mt-1 rounded-md px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-105"
      >
        Añadir el primero
      </button>
    </div>
  )
}
