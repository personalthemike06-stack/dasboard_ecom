import type { Metadata } from 'next'
import { ScrollReveal } from '@/components/marketing/ScrollReveal'
import { PricingCard, type PricingTier } from '@/components/marketing/PricingCard'
import { PLAN_INFO, planStoresLabel } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Precios — Healzyp Analytics',
  description: 'Un precio simple, sin escalones raros. Elige el plan según cuántas tiendas conectas.',
}

// Precio y límite de tiendas vienen de src/lib/plans.ts — la misma fuente
// que aplica de verdad POST /api/stores. Antes estos números estaban
// escritos a mano aquí y el backend nunca los hacía cumplir; que ambos lean
// del mismo sitio es lo que evita que vuelvan a desincronizarse (ver
// audit funcional del 2026-07-25 y database/saas-schema-004-add-plan.sql).
const TIERS: PricingTier[] = [
  {
    name: PLAN_INFO.basico.label,
    priceValue: PLAN_INFO.basico.priceValue,
    storesLabel: planStoresLabel('basico'),
    features: [
      'Pedidos y productos',
      'Hasta 5 tiendas conectadas',
      'Soporte por email',
    ],
  },
  {
    name: PLAN_INFO.premium.label,
    priceValue: PLAN_INFO.premium.priceValue,
    storesLabel: planStoresLabel('premium'),
    features: [
      'Contador en vivo, Mapa de sesiones y Financiero incluidos',
      'Todo lo del plan Básico',
      'Más tiendas conectadas',
      'Soporte prioritario por email',
    ],
    highlighted: true,
  },
  {
    name: PLAN_INFO.ultra.label,
    priceValue: PLAN_INFO.ultra.priceValue,
    storesLabel: planStoresLabel('ultra'),
    features: [
      'Contador en vivo, Mapa de sesiones y Financiero incluidos',
      'Todo lo del plan Premium',
      'Tiendas conectadas ilimitadas',
      'Soporte prioritario',
    ],
    buttonVariant: 'outline',
  },
]

export default function PreciosPage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-4 text-center sm:pt-28">
        <ScrollReveal y={16}>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Un precio simple
          </h1>
          <p className="mt-6 text-lg text-slate-500">
            Sin escalones que suben con tus pedidos. Básico cubre pedidos y productos; Premium y
            Ultra suman Contador en vivo, Mapa de sesiones y Financiero.
          </p>
        </ScrollReveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-6 pb-20 sm:pt-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {TIERS.map((tier, i) => (
            <ScrollReveal key={tier.name} delay={i * 0.15} y={32}>
              <PricingCard {...tier} />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.45} className="mx-auto mt-16 max-w-lg rounded-2xl border border-slate-900/[0.05] bg-slate-50 px-6 py-5 text-center">
          <p className="text-sm text-slate-500">
            Sin permanencia — cancela cuando quieras. ¿Necesitas algo distinto?{' '}
            <a href="/contacto" className="font-medium text-accent hover:underline">
              Escríbenos
            </a>
            .
          </p>
        </ScrollReveal>
      </section>
    </>
  )
}
