// ─────────────────────────────────────────────────────────────────────────────
// POST /api/subscription/cancel — programa la cancelación de la suscripción
// del cliente autenticado para el final del periodo YA PAGADO
// (cancel_at_period_end), en vez de cortar el acceso al instante.
//
// Decisión de negocio, no técnica: el cliente ya abonó el mes completo, así
// que conserva el servicio hasta la fecha que pagó. Evita reembolsos
// prorrateados y las disputas de cargo que provoca cortar un servicio
// pagado, y deja margen para que se arrepienta antes de que venza.
//
// NO toca clients aquí: estado_suscripcion sigue siendo 'activa' — y debe
// serlo, porque el acceso continúa. Es el webhook quien lo pasa a
// 'cancelada' cuando Stripe emite customer.subscription.deleted al vencer el
// periodo. La pantalla de ajustes lee el estado real de Stripe en vivo (ver
// src/lib/subscription.ts) para poder mostrar "se cancela el D de MES".
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from 'next/server'
import { createClient, getCurrentClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { isTrustedOrigin } from '@/lib/security/origin-check'
import { checkRateLimit } from '@/lib/rate-limit'

const CANCEL_MAX = 5
const CANCEL_WINDOW_MS = 60 * 60 * 1000

export async function POST(req: NextRequest) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 })
  }

  const client = await getCurrentClient()
  if (!client) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const rateLimit = checkRateLimit(`cancel-subscription:${client.id}`, CANCEL_MAX, CANCEL_WINDOW_MS)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Prueba de nuevo más tarde.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.max(0, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))) },
      }
    )
  }

  // El id de la suscripción se resuelve SIEMPRE desde la sesión, nunca del
  // body: así no hay forma de mandar el id de otro cliente.
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('stripe_subscription_id')
    .eq('id', client.id)
    .maybeSingle()

  const subscriptionId = data?.stripe_subscription_id
  if (!subscriptionId) {
    return NextResponse.json({ error: 'No tienes ninguna suscripción activa.' }, { status: 400 })
  }

  try {
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    // Ya vencida: no hay nada que cancelar, y llamar a update() sobre una
    // suscripción cancelada devolvería un error de Stripe menos claro.
    if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
      return NextResponse.json({ error: 'Tu suscripción ya está cancelada.' }, { status: 400 })
    }

    // Idempotente: si ya estaba programada, se responde igual que la primera
    // vez en vez de tratarlo como error — el resultado que pedía el usuario
    // ya se cumple.
    const updated = subscription.cancel_at_period_end
      ? subscription
      : await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })

    const periodEnd = updated.items.data[0]?.current_period_end ?? null

    return NextResponse.json({
      ok: true,
      cancelAtPeriodEnd: updated.cancel_at_period_end,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    })
  } catch (err) {
    console.error('[subscription/cancel] Error cancelando la suscripción:', err)
    return NextResponse.json(
      { error: 'No se pudo cancelar la suscripción. Inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}
