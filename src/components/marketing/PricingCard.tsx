'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { CountUpOnView } from '@/components/marketing/CountUpOnView'
import { easeOut } from '@/lib/motion-variants'

export type PricingTier = {
  name: string
  priceValue: number
  storesLabel: string
  features: string[]
  highlighted?: boolean
  /** Solo aplica a tarjetas no destacadas (Premium tiene su propio estilo de botón fijo). */
  buttonVariant?: 'solid' | 'outline'
}

function CheckItem({ text, highlighted }: { text: string; highlighted?: boolean }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          highlighted ? 'bg-white/20' : 'bg-green-100'
        }`}
      >
        <Check className={`h-3 w-3 ${highlighted ? 'text-white' : 'text-green-600'}`} strokeWidth={3} />
      </span>
      <span className={highlighted ? 'text-white/90' : 'text-slate-600'}>{text}</span>
    </li>
  )
}

/**
 * Botón "Suscribirse" enlaza a /contacto, no a un checkout — Stripe todavía
 * no está conectado (pendiente de diseño aprobado, ver conversación). Es un
 * placeholder honesto ("habla con nosotros mientras tanto") en vez de un
 * enlace muerto o un falso estado de "comprado".
 *
 * Estructura de 3 capas para que las animaciones no se pisen entre sí:
 * ScrollReveal (fuera, en precios/page.tsx) anima la entrada por scroll y
 * termina en y:0 — no deja transform residual. El desplazamiento fijo de
 * Premium (translate-y estático) vive en un <div> plano de Tailwind, sin
 * motion, así que no compite con el transform inline de framer-motion. El
 * levantamiento al hover vive en su propio motion.div interno, con su
 * propio whileHover — así el "reposo" de cada capa nunca se pelea con las
 * otras dos.
 */
export function PricingCard({
  name,
  priceValue,
  storesLabel,
  features,
  highlighted,
  buttonVariant = 'solid',
}: PricingTier) {
  return (
    <div className={highlighted ? 'lg:-translate-y-6' : undefined}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.25, ease: easeOut }}
        className={`relative flex flex-col rounded-[20px] p-7 ${
          highlighted
            ? 'bg-gradient-accent text-white shadow-[0_20px_40px_rgba(59,130,246,0.35)]'
            : 'card text-slate-900'
        }`}
      >
        {highlighted && (
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-accent shadow-md">
            Más popular
          </span>
        )}

        <h3 className={`text-sm font-semibold uppercase tracking-wide ${highlighted ? 'text-white/80' : 'text-slate-500'}`}>
          {name}
        </h3>

        <div className="mt-3 flex items-baseline gap-1">
          <CountUpOnView
            value={priceValue}
            decimals={2}
            suffix="€"
            className="text-4xl font-extrabold tracking-tight"
          />
          <span className={highlighted ? 'text-white/70' : 'text-slate-400'}>/mes</span>
        </div>

        <p className={`mt-2 text-sm ${highlighted ? 'text-white/80' : 'text-slate-500'}`}>{storesLabel}</p>

        <div className={`mt-6 border-t ${highlighted ? 'border-white/20' : 'border-slate-900/[0.06]'}`} />

        <ul className="mt-6 flex-1 space-y-3.5">
          {features.map((feature) => (
            <CheckItem key={feature} text={feature} highlighted={highlighted} />
          ))}
        </ul>

        <Link
          href="/contacto"
          className={`mt-8 block rounded-full px-5 py-3 text-center text-sm font-semibold transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${
            highlighted
              ? 'bg-white text-accent hover:brightness-95'
              : buttonVariant === 'outline'
                ? 'border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                : 'bg-accent text-white hover:brightness-95'
          }`}
        >
          Suscribirse
        </Link>
      </motion.div>
    </div>
  )
}
