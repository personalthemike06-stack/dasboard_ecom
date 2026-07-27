'use client'

import { Receipt, Plus } from 'lucide-react'
import { useExpenseDrawer } from '@/components/ExpenseDrawer'

/**
 * No reutiliza <EmptyState> (Server Component sin 'use client'): el botón
 * necesita un onClick, y una función no se puede pasar como prop desde un
 * Server Component — así que este componente entero vive en el cliente,
 * con su propio icono importado localmente en vez de recibido por prop.
 * Mismo useExpenseDrawer().open que AddExpenseButton en la cabecera — el
 * mismo drawer, dos puntos de entrada distintos.
 */
export function ExpensesEmptyState() {
  const { open } = useExpenseDrawer()

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
        <Receipt className="h-7 w-7 text-accent" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">Aún no has registrado gastos</p>
        <p className="mt-0.5 text-xs text-slate-400">
          Añádelos para ver el beneficio real.
        </p>
      </div>
      <button
        onClick={open}
        className="bg-gradient-accent mt-1 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-white transition hover:brightness-105"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
        Añadir gasto
      </button>
    </div>
  )
}
