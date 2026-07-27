'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// variant="icon" — fila de cuenta al pie del sidebar, donde el nombre del
// cliente ya deja claro de qué acción se trata; el texto completo se
// reserva para donde aparece suelto (p.ej. /dashboard/settings).
export function LogoutButton({ variant = 'text' }: { variant?: 'text' | 'icon' } = {}) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleLogout}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-900/[0.04] hover:text-slate-700"
      >
        <LogOut className="h-4 w-4" strokeWidth={2} />
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
    >
      Cerrar sesión
    </button>
  )
}
