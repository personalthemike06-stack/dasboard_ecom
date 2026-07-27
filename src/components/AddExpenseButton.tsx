'use client'

import { Plus } from 'lucide-react'
import { useExpenseDrawer } from '@/components/ExpenseDrawer'

export function AddExpenseButton() {
  const { open } = useExpenseDrawer()

  return (
    <button
      onClick={open}
      className="bg-gradient-accent inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white transition hover:brightness-105"
    >
      <Plus className="h-4 w-4" strokeWidth={2.25} />
      Añadir gasto
    </button>
  )
}
