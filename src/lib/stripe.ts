import Stripe from 'stripe'
import type { ClientPlan } from '@/lib/plans'

// Instancia única, validada de forma perezosa (mismo patrón que
// src/lib/supabase/client.ts): así el build no revienta por esta env var en
// rutas que todavía no la necesitan. apiVersion fijado explícitamente para
// no depender del default de la cuenta de Stripe, que puede cambiar sin
// avisar desde el Dashboard.
let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Falta STRIPE_SECRET_KEY en las variables de entorno.')
  }

  stripeClient = new Stripe(secretKey, { apiVersion: '2026-06-24.dahlia' })
  return stripeClient
}

// Un Price ID de Stripe por plan — nunca hardcodeado, porque el mismo plan
// tiene un Price distinto en modo test y en modo live. Ver checklist de
// creación de productos/precios en Stripe (conversación de diseño).
const PRICE_ENV_BY_PLAN: Record<ClientPlan, string | undefined> = {
  basico: process.env.STRIPE_PRICE_BASICO,
  premium: process.env.STRIPE_PRICE_PREMIUM,
  ultra: process.env.STRIPE_PRICE_ULTRA,
}

export function getStripePriceId(plan: ClientPlan): string {
  const priceId = PRICE_ENV_BY_PLAN[plan]
  if (!priceId) {
    throw new Error(`Falta STRIPE_PRICE_${plan.toUpperCase()} en las variables de entorno.`)
  }
  return priceId
}
