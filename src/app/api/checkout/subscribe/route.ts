// ─────────────────────────────────────────────────────────────────────────────
// POST /api/checkout/subscribe — punto de entrada único para suscribirse y
// para cambiar de plan. Según lo que ya tenga el cliente en Stripe:
//
//   · Suscripción ya activa (o en prueba) → CAMBIO DE PLAN sobre esa misma
//     Subscription (stripe.subscriptions.update), nunca una segunda. Devuelve
//     { status: 'upgraded' }: no hay formulario de pago, se cobra la
//     diferencia prorrateada contra el método de pago ya guardado.
//   · Suscripción a medio pagar ('incomplete') del mismo plan → se reutiliza
//     su client_secret en vez de crear otra.
//   · Nada de lo anterior → Subscription nueva 'incomplete' + client_secret,
//     para que SubscribeForm.tsx la confirme in-page con el Payment Element,
//     sin redirigir nunca a Stripe.
//
// NO crea ni actualiza clients/client_users aquí — eso lo hace únicamente el
// webhook (POST /api/webhooks/stripe), mismo criterio que ya deja dicho
// RegisterForm.tsx: nunca dejar una fila a medias solo porque el usuario
// abrió el formulario de pago sin llegar a completarlo.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentClient, getCurrentUser, createClient } from '@/lib/supabase/server'
import { getStripe, getStripePriceId } from '@/lib/stripe'
import { isTrustedOrigin } from '@/lib/security/origin-check'
import { checkRateLimit } from '@/lib/rate-limit'

const SUBSCRIBE_MAX = 10
const SUBSCRIBE_WINDOW_MS = 60 * 60 * 1000

const subscribeSchema = z.object({
  plan: z.enum(['basico', 'premium', 'ultra']),
})

export async function POST(req: NextRequest) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const rateLimit = checkRateLimit(`checkout-subscribe:${user.id}`, SUBSCRIBE_MAX, SUBSCRIBE_WINDOW_MS)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos de pago en poco tiempo. Prueba de nuevo más tarde.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.max(0, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))) },
      }
    )
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const parsed = subscribeSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Plan no válido.' }, { status: 400 })
  }

  const { plan } = parsed.data

  // Si el usuario ya tiene un cliente vinculado (reactivación o cambio de
  // plan), reutilizamos su Customer de Stripe en vez de crear uno nuevo —
  // así el histórico de facturación no se fragmenta.
  const existingClient = await getCurrentClient()
  let existingCustomerId: string | null = null

  if (existingClient) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('clients')
      .select('stripe_customer_id')
      .eq('id', existingClient.id)
      .maybeSingle()
    existingCustomerId = data?.stripe_customer_id ?? null
  }

  try {
    const stripe = getStripe()
    const priceId = getStripePriceId(plan)
    const nombre =
      typeof user.user_metadata?.nombre === 'string' ? user.user_metadata.nombre : ''

    // A diferencia de Checkout Sessions, crear una Subscription exige un
    // Customer ya existente — no hay atajo tipo customer_email.
    let customerId = existingCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: nombre || undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
    }

    // Una sola consulta para decidir entre los tres caminos (cambio de plan,
    // reutilizar pago a medias, o alta nueva). status:'all' porque Stripe no
    // permite filtrar por varios estados a la vez y aquí hacen falta
    // 'active'/'trialing' e 'incomplete'.
    const existingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 20,
      expand: ['data.latest_invoice.confirmation_secret'],
    })

    // CAMBIO DE PLAN. Antes esto no se comprobaba y se creaba una segunda
    // Subscription en paralelo: el cliente acababa pagando las dos y la
    // vieja quedaba huérfana en Stripe (clients.stripe_subscription_id solo
    // guarda una). Ahora se modifica el item de la que ya existe, que es lo
    // que Stripe entiende por upgrade/downgrade real.
    const liveSub = existingSubs.data.find(
      (sub) => sub.status === 'active' || sub.status === 'trialing'
    )

    if (liveSub) {
      const currentItem = liveSub.items.data[0]

      // Ya está en ese plan — nada que cobrar ni que cambiar.
      if (!currentItem || currentItem.price.id === priceId) {
        return NextResponse.json({ status: 'no_change' })
      }

      // always_invoice: se factura al momento la diferencia proporcional a
      // los días que quedan del ciclo, contra el método de pago ya guardado
      // (save_default_payment_method: 'on_subscription' al darse de alta).
      // La metadata se actualiza en la MISMA llamada para que la factura
      // resultante nazca ya con el plan nuevo — invoice.payment_succeeded
      // lee de ahí (es un snapshot inmutable al finalizar la factura).
      await stripe.subscriptions.update(liveSub.id, {
        items: [{ id: currentItem.id, price: priceId }],
        proration_behavior: 'always_invoice',
        metadata: { supabase_user_id: user.id, plan, nombre },
      })

      return NextResponse.json({ status: 'upgraded' })
    }

    // Evita acumular Subscriptions 'incomplete' huérfanas si el usuario
    // recarga esta página o vuelve atrás sin llegar a pagar: reutiliza la
    // que ya esté esperando pago para este mismo plan en vez de crear una
    // nueva en cada visita.
    const reusable = existingSubs.data.find(
      (sub) => sub.status === 'incomplete' && sub.items.data[0]?.price.id === priceId
    )

    const subscription =
      reusable ??
      (await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.confirmation_secret'],
        metadata: { supabase_user_id: user.id, plan, nombre },
      }))

    const invoice = subscription.latest_invoice
    if (!invoice || typeof invoice === 'string') {
      throw new Error('Stripe no devolvió la factura inicial expandida.')
    }

    const clientSecret = invoice.confirmation_secret?.client_secret
    if (!clientSecret) {
      throw new Error('Stripe no devolvió un client_secret de pago.')
    }

    return NextResponse.json({ clientSecret })
  } catch (err) {
    console.error('[checkout/subscribe] Error creando la Subscription:', err)
    return NextResponse.json({ error: 'No se pudo iniciar el pago. Inténtalo de nuevo.' }, { status: 500 })
  }
}
