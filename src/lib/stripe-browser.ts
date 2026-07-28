import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js'

// Promesa cacheada (patrón recomendado por Stripe): loadStripe() descarga
// stripe.js una sola vez por sesión de página, no en cada montaje de
// SubscribeForm. Clave publicable — a diferencia de STRIPE_SECRET_KEY, esta
// SÍ va al navegador, por eso lleva el prefijo NEXT_PUBLIC_.
let stripeJsPromise: Promise<StripeJs | null> | null = null

export function getStripeJs(): Promise<StripeJs | null> {
  if (!stripeJsPromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!publishableKey) {
      throw new Error('Falta NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY en las variables de entorno.')
    }
    stripeJsPromise = loadStripe(publishableKey)
  }
  return stripeJsPromise
}
