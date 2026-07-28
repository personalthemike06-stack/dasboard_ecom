// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/stripe — lo llama Stripe, nunca un navegador: por eso
// esta ruta NO pasa por isTrustedOrigin (que sí usan las demás rutas de
// estado de este repo, ver POST /api/stores). La seguridad aquí es la firma
// (constructEvent) sobre el cuerpo exacto que envió Stripe.
//
// Usa createAdminClient() (service_role) porque no hay sesión de usuario de
// la que colgar RLS — es la única ruta con permiso para escribir
// clients/client_users directamente.
//
// Con el flujo de Payment Element (Subscription creada directamente vía API,
// sin Checkout Session), no existe checkout.session.completed — el primer
// pago de una suscripción nueva se confirma con invoice.payment_succeeded.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ClientPlan } from '@/lib/plans'

type EstadoSuscripcion = 'activa' | 'cancelada' | 'pago_fallido' | 'prueba'

function mapSubscriptionStatus(status: Stripe.Subscription.Status): EstadoSuscripcion | null {
  switch (status) {
    case 'active':
      return 'activa'
    case 'trialing':
      return 'prueba'
    case 'past_due':
    case 'unpaid':
      return 'pago_fallido'
    case 'canceled':
    case 'incomplete_expired':
      return 'cancelada'
    default:
      // 'incomplete' (pago inicial aún resolviéndose) y 'paused': no se
      // toca estado_suscripcion.
      return null
  }
}

function customerIdOf(customer: string | Stripe.Customer | Stripe.DeletedCustomer): string {
  return typeof customer === 'string' ? customer : customer.id
}

// metadata de Stripe es texto libre: nunca escribir su valor directamente en
// la columna `plan` (enum de Postgres) sin comprobar que es uno de los tres
// válidos — una suscripción vieja o creada a mano podría traer cualquier cosa.
function toClientPlan(value: string | undefined): ClientPlan | null {
  return value === 'basico' || value === 'premium' || value === 'ultra' ? value : null
}

// invoice.payment_succeeded: crea la fila de clients + client_users la
// primera vez que un usuario paga, o actualiza la existente si ya estaba
// vinculado (reactivación / cambio de plan) — nunca duplica. Se dispara en
// cada factura pagada (también renovaciones), pero la lógica de
// "vincular si no existe, si no actualizar" es idempotente en ambos casos.
async function handleInvoicePaymentSucceeded(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  // En API 2026-06-24.dahlia, la suscripción que generó la factura vive en
  // invoice.parent.subscription_details — ya NO en invoice.subscription
  // (ese campo solo existe en los parámetros de creación, no en el recurso).
  const subscriptionDetails = invoice.parent?.subscription_details
  if (!subscriptionDetails) return // factura no asociada a una suscripción

  const userId = subscriptionDetails.metadata?.supabase_user_id
  const plan = toClientPlan(subscriptionDetails.metadata?.plan)
  const nombre = subscriptionDetails.metadata?.nombre || 'Cliente'
  const customerId = invoice.customer ? customerIdOf(invoice.customer) : null
  const subscriptionId =
    typeof subscriptionDetails.subscription === 'string'
      ? subscriptionDetails.subscription
      : subscriptionDetails.subscription.id
  const email = invoice.customer_email ?? ''

  if (!userId || !plan || !customerId) {
    console.error('[stripe webhook] invoice.payment_succeeded sin metadata esperada', invoice.id)
    return
  }

  const { data: existingLink } = await supabase
    .from('client_users')
    .select('client_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existingLink) {
    await supabase
      .from('clients')
      .update({
        plan,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        estado_suscripcion: 'activa',
      })
      .eq('id', existingLink.client_id)
    return
  }

  const { data: newClient, error: insertError } = await supabase
    .from('clients')
    .insert({
      nombre,
      email_contacto: email,
      plan,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      estado_suscripcion: 'activa',
    })
    .select('id')
    .single()

  if (insertError || !newClient) {
    console.error('[stripe webhook] No se pudo crear clients:', insertError)
    return
  }

  const { error: linkError } = await supabase
    .from('client_users')
    .insert({ user_id: userId, client_id: newClient.id })

  if (linkError) {
    // TODO (2026-07-28, auditoría de pagos): fallo silencioso. Si este insert
    // falla, `clients` ya existe pero el usuario no queda vinculado: la
    // función retorna con normalidad, el handler responde 200, y Stripe da el
    // evento por procesado y NO lo reintenta. Resultado: cliente cobrado y sin
    // acceso, atascado en "elige tu plan", y el único rastro es esta línea de
    // log — nadie se entera hasta que reclama. Opciones al abordarlo: lanzar
    // para devolver 500 y que Stripe reintente (ojo: reintentaría también el
    // insert de `clients`, hace falta que sea idempotente), o borrar la fila
    // de `clients` recién creada para que el reintento parta de cero.
    console.error('[stripe webhook] No se pudo crear client_users:', linkError)
  }
}

// Cubre también los cambios de plan hechos desde POST /api/checkout/subscribe
// (stripe.subscriptions.update): el plan se propaga desde la metadata, que esa
// ruta reescribe en la misma llamada que cambia el precio. Antes este handler
// solo tocaba estado_suscripcion, así que tras un upgrade clients.plan se
// quedaba con el plan viejo y el cliente seguía viendo el dashboard anterior
// pese a estar pagando el nuevo.
//
// Acotado a la suscripción registrada, igual que handleSubscriptionDeleted:
// filtrar solo por stripe_customer_id hacía que CUALQUIER evento de CUALQUIER
// suscripción suya reescribiese estado y stripe_subscription_id. Ese era el
// mecanismo que dejaba huérfana la suscripción vieja al duplicarse un
// upgrade, y el que permitía que expirar una 'incomplete' abandonada
// bloquease una cuenta al corriente de pago. Quién es "la suscripción de la
// cuenta" lo fija invoice.payment_succeeded, que sí puede resolverlo por
// usuario; aquí solo se propagan cambios sobre esa.
async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const estado = mapSubscriptionStatus(subscription.status)
  if (!estado) return

  const plan = toClientPlan(subscription.metadata?.plan)

  await supabase
    .from('clients')
    .update({
      estado_suscripcion: estado,
      ...(plan ? { plan } : {}),
    })
    .eq('stripe_customer_id', customerIdOf(subscription.customer))
    .eq('stripe_subscription_id', subscription.id)
}

// Solo bloquea la cuenta si la suscripción borrada es la que el cliente tiene
// registrada. Filtrar únicamente por stripe_customer_id (como se hacía antes)
// significaba que borrar CUALQUIER suscripción suya — por ejemplo una
// 'incomplete' abandonada, o una duplicada de las que generaba el bug de
// upgrade — dejaba fuera del dashboard a alguien que seguía pagando.
async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  await supabase
    .from('clients')
    .update({ estado_suscripcion: 'cancelada' })
    .eq('stripe_customer_id', customerIdOf(subscription.customer))
    .eq('stripe_subscription_id', subscription.id)
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    console.error('[stripe webhook] Falta stripe-signature o STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Webhook no configurado.' }, { status: 500 })
  }

  // Raw body sin parsear: constructEvent necesita el texto exacto que
  // mandó Stripe para que la firma cuadre — req.json() ya lo habría
  // reserializado y roto la verificación.
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe webhook] Firma inválida:', err)
    return NextResponse.json({ error: 'Firma inválida.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // TODO (2026-07-28, auditoría de pagos): el 200 se devuelve DESPUÉS de
  // terminar todo el trabajo en Supabase, no antes. Hoy es rápido (6-160 ms
  // medidos en las pruebas en vivo), pero acopla el ACK a Stripe con la
  // latencia de Supabase: si Supabase se degrada, Stripe deja de recibir el
  // 200 a tiempo, reintenta, y cada reintento vuelve a golpear una base ya
  // saturada. El patrón recomendado es responder 200 nada más verificar la
  // firma y procesar el evento en segundo plano (cola/worker), lo que a su
  // vez exige que el procesado sea idempotente y observable — por eso no se
  // aplicó junto al resto de fixes de hoy: no es un cambio de dos líneas.
  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(supabase, event.data.object)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object)
        break
      default:
        break
    }
  } catch (err) {
    // Devolver 500 (no 200) es intencional: así Stripe reintenta el evento
    // en vez de darlo por procesado cuando en realidad falló a mitad.
    console.error(`[stripe webhook] Error procesando ${event.type}:`, err)
    return NextResponse.json({ error: 'Error interno procesando el evento.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
