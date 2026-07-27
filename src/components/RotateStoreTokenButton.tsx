'use client'

import { useState, useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { STATUS_COLORS } from '@/lib/status-colors'
import { CopyableField } from '@/components/CopyableField'

type State =
  | { step: 'idle' }
  | { step: 'confirming' }
  | { step: 'error'; message: string }
  | { step: 'done'; apiToken: string }

/**
 * Antes de esto no había forma de invalidar un api_token filtrado sin editar
 * la fila a mano en Supabase (ver audit-saas-security.md §2/Fase 2). Mismo
 * patrón de "se enseña una sola vez" que ConnectStoreForm — PATCH
 * /api/stores/:id/rotate genera el token nuevo server-side y lo devuelve
 * en la respuesta, nunca antes.
 */
export function RotateStoreTokenButton({ storeId }: { storeId: string }) {
  const [state, setState] = useState<State>({ step: 'idle' })
  const [pending, startTransition] = useTransition()

  function handleRotate() {
    startTransition(async () => {
      const res = await fetch(`/api/stores/${storeId}/rotate`, { method: 'PATCH' })
      const body = (await res.json().catch(() => null)) as { apiToken: string } | { error: string } | null

      if (!res.ok || !body || !('apiToken' in body)) {
        setState({
          step: 'error',
          message: body && 'error' in body ? body.error : 'No se pudo rotar el token.',
        })
        return
      }

      setState({ step: 'done', apiToken: body.apiToken })
    })
  }

  if (state.step === 'done') {
    return (
      <div className="mt-2 space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs text-amber-800">
          Token nuevo generado — el anterior ya no funciona. Cópialo ahora, pégalo como{' '}
          <code className="font-semibold">DASHBOARD_API_TOKEN</code> en el <code>.env</code> de la
          tienda y haz redeploy. No podrás volver a verlo completo.
        </p>
        <CopyableField value={state.apiToken} label="DASHBOARD_API_TOKEN nuevo" />
        <button
          type="button"
          onClick={() => setState({ step: 'idle' })}
          className="text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          Cerrar
        </button>
      </div>
    )
  }

  if (state.step === 'confirming') {
    return (
      <div className="mt-2 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs text-slate-600">
          El token actual dejará de funcionar de inmediato — la tienda no podrá enviar datos hasta
          que actualices <code>DASHBOARD_API_TOKEN</code> con el nuevo valor. ¿Continuar?
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRotate}
            disabled={pending}
            className="rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-white transition hover:brightness-95 disabled:opacity-50"
          >
            {pending ? 'Generando…' : 'Sí, generar token nuevo'}
          </button>
          <button
            type="button"
            onClick={() => setState({ step: 'idle' })}
            className="rounded-md px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setState({ step: 'confirming' })}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
      >
        <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
        Rotar token
      </button>
      {state.step === 'error' && (
        <p className="mt-1.5 text-xs" style={{ color: STATUS_COLORS.critical }}>
          {state.message}
        </p>
      )}
    </div>
  )
}
