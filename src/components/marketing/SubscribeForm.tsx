'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { getStripeJs } from '@/lib/stripe-browser'
import type { ClientPlan } from '@/lib/plans'

// stripe.confirmPayment con redirect: 'if_required' resuelve in-page para el
// caso normal (tarjeta) — el usuario nunca sale de este dominio. return_url
// es obligatorio igualmente: Stripe lo usa como destino si el método de
// pago elegido sí necesita salir (algunos bancos, 3DS de ciertos emisores).
function PayButton() {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    setError(null)

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?checkout=success`,
      },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? 'No se pudo procesar el pago. Revisa los datos e inténtalo de nuevo.')
      setSubmitting(false)
      return
    }

    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
      router.push('/dashboard?checkout=success')
      return
    }

    // Estado inesperado sin error explícito (raro) — no atascar el botón.
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
      >
        {submitting ? 'Procesando…' : 'Confirmar suscripción'}
      </button>
    </form>
  )
}

export function SubscribeForm({ plan }: { plan: ClientPlan }) {
  const router = useRouter()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const res = await fetch('/api/checkout/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan }),
        })
        const data = await res.json()

        if (cancelled) return

        if (!res.ok) {
          setError(data.error ?? 'No se pudo iniciar el pago. Inténtalo de nuevo.')
          return
        }

        // Cambio de plan sobre una suscripción que ya estaba activa: se cobra
        // contra el método de pago guardado, así que no hay Payment Element
        // que montar — solo queda volver al dashboard.
        if (data.status === 'upgraded' || data.status === 'no_change') {
          router.push('/dashboard?checkout=success')
          router.refresh()
          return
        }

        if (!data.clientSecret) {
          setError('No se pudo iniciar el pago. Inténtalo de nuevo.')
          return
        }

        setClientSecret(data.clientSecret)
      } catch {
        if (!cancelled) setError('No se pudo iniciar el pago. Inténtalo de nuevo.')
      }
    }

    start()
    return () => {
      cancelled = true
    }
  }, [plan, router])

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  if (!clientSecret) {
    return <p className="text-sm text-slate-500">Preparando el formulario de pago…</p>
  }

  return (
    <Elements
      stripe={getStripeJs()}
      options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#3B82F6' } } }}
    >
      <PayButton />
    </Elements>
  )
}
