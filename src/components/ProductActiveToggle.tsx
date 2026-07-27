'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { STATUS_COLORS } from '@/lib/status-colors'

/**
 * Único mutation del dashboard. products_update_admin en supabase/schema.sql
 * de la tienda ya da UPDATE completo a cualquier JWT admin (sin restricción
 * de columna) — no hace falta ningún GRANT adicional para este toggle.
 */
export function ProductActiveToggle({ id, activo }: { id: string; activo: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function toggle() {
    setErrorMsg(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('products')
        .update({ activo: !activo })
        .eq('id', id)

      if (error) {
        setErrorMsg(error.message)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={toggle}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-slate-700 hover:brightness-95 disabled:opacity-50"
        style={{
          backgroundColor: activo ? '#e7f6e7' : '#f1f0ee',
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: activo ? STATUS_COLORS.good : STATUS_COLORS.neutral }}
          aria-hidden
        />
        {pending ? 'Guardando…' : activo ? 'Activo' : 'Inactivo'}
      </button>
      {errorMsg && (
        <p className="text-xs" style={{ color: STATUS_COLORS.critical }}>
          {errorMsg}
        </p>
      )}
    </div>
  )
}
