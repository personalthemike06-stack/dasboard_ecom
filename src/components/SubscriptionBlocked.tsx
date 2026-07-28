import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { STATUS_COLORS, STATUS_SOFT_COLORS } from '@/lib/status-colors'

/**
 * Sustituye TODO el dashboard (nav + contenido, ver dashboard/layout.tsx)
 * cuando estado_suscripcion es 'cancelada' o 'pago_fallido' — a diferencia
 * del antiguo bloqueo por plan, esto no es "esta página no", es "el
 * dashboard entero no" hasta que se renueve.
 */
export function SubscriptionBlocked({
  estado,
}: {
  estado: 'cancelada' | 'pago_fallido'
}) {
  const message =
    estado === 'cancelada'
      ? 'Tu suscripción está cancelada.'
      : 'No hemos podido procesar el pago de tu suscripción.'

  return (
    <div className="card flex w-full max-w-sm flex-col items-center gap-3 p-10 text-center">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: STATUS_SOFT_COLORS.critical }}
      >
        <AlertTriangle className="h-6 w-6" style={{ color: STATUS_COLORS.critical }} strokeWidth={2} />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Renueva tu suscripción</h2>
        <p className="mt-1 text-sm text-slate-500">
          {message} Renueva para seguir accediendo a Healzyp Analytics.
        </p>
      </div>
      <Link
        href="/precios"
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:brightness-95"
      >
        Renovar suscripción
      </Link>
    </div>
  )
}
