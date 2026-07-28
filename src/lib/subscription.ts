import { cache } from 'react'
import { createClient, getCurrentClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export type SubscriptionSummary = {
  /** true = ya pidió cancelar; sigue con acceso hasta currentPeriodEnd. */
  cancelAtPeriodEnd: boolean
  /** Fin del periodo ya pagado, ISO. null si Stripe no lo devuelve. */
  currentPeriodEnd: string | null
  /** Estado crudo de Stripe — 'canceled' significa que el periodo ya venció. */
  status: string
}

/**
 * Estado de facturación leído EN VIVO de Stripe, no de Supabase.
 *
 * Hace falta porque cancelar a fin de periodo no cambia
 * clients.estado_suscripcion: el cliente sigue 'activa' (y con acceso) hasta
 * que vence lo pagado, así que la base de datos por sí sola no puede
 * distinguir "activa" de "activa pero ya cancelada". Sin esto, cancelar y
 * recargar la página parecería no haber hecho nada.
 *
 * Devuelve null (en vez de lanzar) si no hay suscripción o si Stripe falla:
 * es información complementaria de una página de ajustes, nunca debe tumbar
 * el render. cache() de React evita repetir la llamada dentro del mismo
 * render si más de un componente la pide.
 */
export const getSubscriptionSummary = cache(async (): Promise<SubscriptionSummary | null> => {
  const client = await getCurrentClient()
  if (!client) return null

  // stripe_subscription_id no forma parte de CurrentClient (no lo necesita
  // ninguna otra pantalla) — se pide aparte, igual que hace
  // POST /api/checkout/subscribe con stripe_customer_id.
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('stripe_subscription_id')
    .eq('id', client.id)
    .maybeSingle()

  const subscriptionId = data?.stripe_subscription_id
  if (!subscriptionId) return null

  try {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId)

    // OJO: current_period_end ya NO está en el objeto Subscription en la API
    // 2026-06-24.dahlia — vive en cada subscription item. Verificado contra
    // los tipos del SDK instalado, no asumido.
    const periodEnd = subscription.items.data[0]?.current_period_end ?? null

    return {
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      status: subscription.status,
    }
  } catch (err) {
    console.error('[subscription] No se pudo leer la suscripción de Stripe:', err)
    return null
  }
})
