'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { STATUS_COLORS } from '@/lib/status-colors'

/**
 * Único mutation de Productos. Pasa por /api/products/[id] (proxy
 * server-side hacia PATCH /api/dashboard/products/[id] de la tienda) en vez
 * de escribir directo a Supabase — el navegador del dashboard SaaS ya no
 * tiene acceso a la Supabase de ninguna tienda, ver el comentario en
 * src/lib/store-api.ts sobre por qué el api_token nunca cruza al cliente.
 */
export function ProductActiveToggle({ id, activo }: { id: string; activo: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function toggle() {
    setErrorMsg(null)
    startTransition(async () => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setErrorMsg(body?.error ?? 'No se pudo actualizar el producto.')
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
