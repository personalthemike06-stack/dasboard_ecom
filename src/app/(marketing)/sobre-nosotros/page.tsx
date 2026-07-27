import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Shield, Building2 } from 'lucide-react'
import { BentoCard } from '@/components/marketing/BentoCard'
import { CountUpOnView } from '@/components/marketing/CountUpOnView'
import { HeroIntro } from '@/components/marketing/HeroIntro'

export const metadata: Metadata = {
  title: 'Sobre nosotros — Healzyp Analytics',
  description: 'Cómo nació Healzyp Analytics: un panel interno para gestionar Healzyp, ahora disponible para cualquier tienda.',
}

const STEPS = [
  {
    number: '1',
    title: 'Conecta tu tienda',
    description: 'Pega la URL de tu tienda — sin instalar nada complicado.',
    accent: true,
  },
  {
    number: '2',
    title: 'Genera tu token',
    description: 'Un token seguro, generado al momento. Solo tú lo ves.',
  },
  {
    number: '3',
    title: 'Ve tu panel en vivo',
    description: 'Sesiones, pedidos y financiero, actualizándose solos.',
  },
]

export default function SobreNosotrosPage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-2xl px-6 pt-20 pb-12 text-center sm:pt-28">
        <HeroIntro />
      </section>

      {/* Bento grid */}
      <section className="relative overflow-hidden px-6 pt-4 pb-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-[8%] h-72 w-72 rounded-full bg-accent/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[12%] h-72 w-72 rounded-full bg-accent-mint/20 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-6 md:auto-rows-[minmax(100px,auto)] md:gap-5">
          {/* Cita de origen — 4x2 */}
          <BentoCard delay={0} className="bg-gradient-accent p-7 text-white md:col-span-4 md:row-span-2">
            <div className="flex h-full flex-col justify-center">
              <p className="text-xl leading-relaxed italic sm:text-2xl">
                &ldquo;Lo construimos primero para nosotros: sesiones activas, pedidos, productos y
                el estado financiero real de Healzyp, todo en un mismo sitio.&rdquo;
              </p>
              <p className="mt-5 text-sm font-medium text-white/75">
                — Cómo empezó Healzyp Analytics
              </p>
            </div>
          </BentoCard>

          {/* Stats — 2x1 cada uno */}
          <BentoCard delay={0.08} className="card flex flex-col justify-center p-5 md:col-span-2">
            <CountUpOnView
              value={100}
              suffix="%"
              className="bg-gradient-accent bg-clip-text text-3xl font-extrabold text-transparent"
            />
            <p className="mt-1 text-xs font-medium text-slate-500">tiempo real</p>
          </BentoCard>

          <BentoCard delay={0.12} className="card flex flex-col justify-center p-5 md:col-span-2">
            <CountUpOnView
              value={5}
              suffix=" min"
              className="bg-gradient-accent bg-clip-text text-3xl font-extrabold text-transparent"
            />
            <p className="mt-1 text-xs font-medium text-slate-500">para conectar tu tienda</p>
          </BentoCard>

          {/* Mini-tarjetas — 3x1 cada una */}
          <BentoCard delay={0.16} className="card flex items-center gap-3 p-5 md:col-span-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft">
              <Shield className="h-4 w-4 text-accent" strokeWidth={2} />
            </span>
            <p className="text-sm font-medium text-slate-700">
              Tus datos, solo tuyos — nunca los compartimos.
            </p>
          </BentoCard>

          <BentoCard delay={0.2} className="card flex items-center gap-3 p-5 md:col-span-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft">
              <Building2 className="h-4 w-4 text-accent" strokeWidth={2} />
            </span>
            <p className="text-sm font-medium text-slate-700">
              Conecta varias tiendas desde el mismo panel.
            </p>
          </BentoCard>

          {/* Cómo funciona — 2x2 cada uno */}
          {STEPS.map((step, i) => (
            <BentoCard
              key={step.number}
              delay={0.24 + i * 0.06}
              className={`flex flex-col justify-center p-6 md:col-span-2 md:row-span-2 ${
                step.accent
                  ? 'bg-accent text-white'
                  : 'card border border-slate-900/[0.06]'
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  step.accent ? 'bg-white/20 text-white' : 'bg-accent-soft text-accent'
                }`}
              >
                {step.number}
              </span>
              <h3 className={`mt-4 text-base font-semibold ${step.accent ? 'text-white' : 'text-slate-900'}`}>
                {step.title}
              </h3>
              <p className={`mt-1.5 text-sm ${step.accent ? 'text-white/80' : 'text-slate-500'}`}>
                {step.description}
              </p>
            </BentoCard>
          ))}

          {/* Módulo final — glassmorphism, 6x1 */}
          <BentoCard
            delay={0.5}
            className="relative flex items-center justify-between gap-4 border border-white/50 bg-white/40 p-6 backdrop-blur-md md:col-span-6"
          >
            <p className="text-sm font-medium text-slate-700 sm:text-base">
              Seguimos siendo un equipo pequeño construyendo la herramienta que usamos todos los
              días — eso es lo único que prometemos.
            </p>
            <Link
              href="/contacto"
              aria-label="Contactar"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-transform duration-200 hover:scale-105"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </BentoCard>
        </div>
      </section>
    </>
  )
}
