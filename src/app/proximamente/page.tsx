import Link from 'next/link'

/**
 * Placeholder del botón "Renovar suscripción" en SubscriptionBlocked — el
 * pago real llega con Stripe (hito aparte, pendiente de aprobación). Página
 * pública a propósito (fuera de /dashboard/*): tiene que ser alcanzable
 * incluso con el dashboard bloqueado por falta de pago.
 */
export default function ProximamentePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="card w-full max-w-sm space-y-3 p-8 text-center">
        <h1 className="text-lg font-semibold text-slate-900">Próximamente</h1>
        <p className="text-sm text-slate-500">
          La renovación de tu suscripción en línea estará disponible muy pronto. Mientras
          tanto, contacta con nosotros para gestionarla.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  )
}
