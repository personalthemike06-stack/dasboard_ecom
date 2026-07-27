'use client'

import { createContext, useContext, useState } from 'react'
import { X } from 'lucide-react'
import { NewExpenseForm } from '@/components/NewExpenseForm'

const ExpenseDrawerContext = createContext<{ open: () => void } | null>(null)

/**
 * El botón "Añadir gasto" de la cabecera y el botón del estado vacío de
 * "Gastos recientes" abren el MISMO drawer — de ahí el contexto en vez de
 * cada uno con su propio estado/formulario duplicado.
 */
export function useExpenseDrawer() {
  const ctx = useContext(ExpenseDrawerContext)
  if (!ctx) throw new Error('useExpenseDrawer debe usarse dentro de ExpenseDrawerProvider')
  return ctx
}

export function ExpenseDrawerProvider({
  storeId,
  children,
}: {
  storeId: string
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <ExpenseDrawerContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Cerrar"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-900/30"
          />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Añadir gasto</h3>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-900/[0.04] hover:text-slate-700"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <NewExpenseForm storeId={storeId} />
            </div>
          </aside>
        </div>
      )}
    </ExpenseDrawerContext.Provider>
  )
}
