'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'

/**
 * Sustituye TODO el dashboard cuando la sesión es válida pero el usuario
 * todavía no tiene fila en clients (ver dashboard/layout.tsx) — caso normal
 * para cualquier cuenta recién registrada que aún no eligió plan, y también
 * el estado justo después de pagar: el redirect de SubscribeForm.tsx llega
 * con ?checkout=success antes de que el webhook haya tenido tiempo de crear
 * la fila. Client Component (no el layout) porque useSearchParams() es lo
 * único que distingue ambos casos — el estado real de la suscripción sigue
 * viniendo siempre del webhook, esto solo decide qué copy mostrar mientras
 * tanto y refresca la página hasta que aparezca.
 */
export function AwaitingSubscription() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const processing = searchParams.get('checkout') === 'success'

  useEffect(() => {
    if (!processing) return
    const id = setInterval(() => router.refresh(), 3000)
    return () => clearInterval(id)
  }, [processing, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="card w-full max-w-sm space-y-4 p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
          {processing ? (
            <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={2} />
          ) : (
            <Sparkles className="h-6 w-6 text-accent" strokeWidth={2} />
          )}
        </span>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-slate-900">
            {processing ? 'Procesando tu suscripción…' : 'Casi listo — elige tu plan para empezar'}
          </h1>
          <p className="text-sm text-slate-500">
            {processing
              ? 'Ya hemos recibido tu pago. Esto se activa solo en unos segundos — no cierres ni recargues esta pestaña.'
              : 'Tu cuenta ya está creada. Solo falta elegir un plan para activar tu dashboard.'}
          </p>
        </div>
        {!processing && (
          <Link
            href="/precios"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 active:scale-[0.98]"
          >
            Ver planes
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        )}
        <LogoutButton />
      </div>
    </div>
  )
}
