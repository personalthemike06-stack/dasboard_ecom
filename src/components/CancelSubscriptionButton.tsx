'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle } from 'lucide-react'
import { STATUS_COLORS } from '@/lib/status-colors'

type State =
  | { step: 'idle' }
  | { step: 'confirming' }
  | { step: 'error'; message: string }
  | { step: 'done' }

/**
 * Cancelación a fin de periodo (ver POST /api/subscription/cancel): el
 * cliente NO pierde el acceso al pulsar, lo conserva hasta la fecha que ya
 * pagó. El copy de la confirmación dice exactamente eso — prometer "pierdes
 * el acceso ahora" sería mentir y frenaría cancelaciones por miedo.
 *
 * Mismo patrón de confirmación en línea que RotateStoreTokenButton (paso
 * intermedio dentro de la propia tarjeta, no window.confirm ni modal): el
 * texto explicativo no cabe en un diálogo del navegador, y así el usuario
 * ve qué va a pasar antes de decidir.
 *
 * Tras cancelar, router.refresh() vuelve a pedir la página en servidor, que
 * relee el estado real de Stripe y pinta "se cancela el D de MES" — sin que
 * el usuario tenga que recargar a mano.
 */
export function CancelSubscriptionButton({ periodEndLabel }: { periodEndLabel: string | null }) {
  const router = useRouter()
  const [state, setState] = useState<State>({ step: 'idle' })
  const [pending, startTransition] = useTransition()

  function handleCancel() {
    startTransition(async () => {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' })
      const body = (await res.json().catch(() => null)) as
        | { ok: true }
        | { error: string }
        | null

      if (!res.ok || !body || !('ok' in body)) {
        setState({
          step: 'error',
          message: body && 'error' in body ? body.error : 'No se pudo cancelar la suscripción.',
        })
        return
      }

      setState({ step: 'done' })
      router.refresh()
    })
  }

  if (state.step === 'done') {
    return (
      <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        Suscripción cancelada. Mantienes el acceso
        {periodEndLabel ? ` hasta el ${periodEndLabel}` : ' hasta el final del periodo ya pagado'}.
      </p>
    )
  }

  if (state.step === 'confirming') {
    return (
      <div className="mt-4 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs text-slate-600">
          No perderás el acceso ahora: tu plan sigue funcionando
          {periodEndLabel ? ` hasta el ${periodEndLabel}` : ' hasta el final del periodo ya pagado'},
          y no se te volverá a cobrar. Puedes volver a suscribirte cuando quieras.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={pending}
            className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:brightness-95 disabled:opacity-50"
          >
            {pending ? 'Cancelando…' : 'Sí, cancelar suscripción'}
          </button>
          <button
            type="button"
            onClick={() => setState({ step: 'idle' })}
            className="rounded-md px-2.5 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100"
          >
            No, seguir suscrito
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setState({ step: 'confirming' })}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
      >
        <XCircle className="h-3.5 w-3.5" strokeWidth={2} />
        Cancelar suscripción
      </button>
      {state.step === 'error' && (
        <p className="mt-1.5 text-xs" style={{ color: STATUS_COLORS.critical }}>
          {state.message}
        </p>
      )}
    </div>
  )
}
