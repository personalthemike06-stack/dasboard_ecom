import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { ScrollReveal } from '@/components/marketing/ScrollReveal'
import { SubscribeForm } from '@/components/marketing/SubscribeForm'
import { getCurrentUser } from '@/lib/supabase/server'
import { PLAN_INFO, type ClientPlan } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Confirma tu suscripción — Healzyp Analytics',
}

function isClientPlan(value: string): value is ClientPlan {
  return value === 'basico' || value === 'premium' || value === 'ultra'
}

// Guarda de autenticación server-side (mismo patrón que dashboard/layout.tsx)
// en vez de un fetch que devuelva 401: aquí el usuario tiene que existir
// antes de que SubscribeForm pueda pedir el client_secret, así que cortarlo
// antes de renderizar el formulario evita un parpadeo de "cargando" que
// termina en error.
export default async function PagarPage({ params }: { params: Promise<{ plan: string }> }) {
  const { plan } = await params
  if (!isClientPlan(plan)) notFound()

  const user = await getCurrentUser()
  if (!user) redirect('/registro')

  const planInfo = PLAN_INFO[plan]

  return (
    <section className="relative mx-auto max-w-[560px] px-6 py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),_transparent_70%)]"
      />

      <ScrollReveal y={16} className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Confirma tu suscripción
        </h1>
        <p className="mt-4 text-lg text-slate-500">
          Plan {planInfo.label} · {planInfo.priceValue.toFixed(2)}€/mes
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.1} className="card mt-10 p-7">
        <SubscribeForm plan={plan} />
      </ScrollReveal>
    </section>
  )
}
