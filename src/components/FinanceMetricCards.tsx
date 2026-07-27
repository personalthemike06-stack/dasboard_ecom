'use client'

import { motion } from 'motion/react'
import { Receipt, TrendingUp, Wallet } from 'lucide-react'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { Sparkline } from '@/components/Sparkline'
import { DeltaBadge } from '@/components/DeltaBadge'
import { staggerContainer, fadeInUp } from '@/lib/motion-variants'
import type { Delta } from '@/lib/finance'

export function FinanceMetricCards({
  ingresosMes,
  gastosMes,
  beneficioMes,
  ingresosDelta,
  gastosDelta,
  beneficioDelta,
  beneficioSpark,
}: {
  ingresosMes: number
  gastosMes: number
  beneficioMes: number
  ingresosDelta: Delta | null
  gastosDelta: Delta | null
  beneficioDelta: Delta | null
  beneficioSpark: number[]
}) {
  const beneficioGood = beneficioMes >= 0
  // Degradado sólido diagonal en vez del pastel plano anterior — verde/
  // turquesa si hay beneficio, rojo/naranja (mismos tonos que
  // STATUS_COLORS.critical/serious, ya usados en el resto del dashboard)
  // si no lo hay. La condición beneficioGood no cambia, solo qué estilo se
  // le aplica a cada rama.
  const beneficioGradient = beneficioGood
    ? 'linear-gradient(135deg, #22a06b 0%, #38a3a0 100%)'
    : 'linear-gradient(135deg, #d03b3b 0%, #ec835a 100%)'

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4 lg:grid-cols-3"
    >
      {/* Hero: beneficio del mes, con la tendencia embebida (área con
          degradado, sin eje — ver Sparkline) en vez de un número suelto. */}
      <motion.div
        variants={fadeInUp}
        className="relative flex flex-col overflow-hidden rounded-2xl p-6 text-white lg:col-span-2"
        style={{ backgroundImage: beneficioGradient }}
      >
        {/* Decoración circular sutil — parcialmente fuera del borde, por
            eso el card necesita overflow-hidden: la parte que sobra se
            recorta ahí en vez de desbordar el layout. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/[0.08]"
        />

        <div className="relative flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <Wallet className="h-5 w-5 text-white" strokeWidth={2.25} />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/85">
            Beneficio · mes actual
          </p>
        </div>

        <div className="relative mt-3 flex flex-wrap items-end gap-3">
          <AnimatedNumber
            value={beneficioMes}
            format="currency"
            className="block text-5xl font-extrabold text-white tabular-nums"
          />
          <div className="pb-1.5">
            <DeltaBadge delta={beneficioDelta} upIsGood />
          </div>
        </div>

        <div className="relative mt-5 flex-1">
          <Sparkline data={beneficioSpark} color="#ffffff" height="h-24" />
        </div>
      </motion.div>

      {/* Ingresos y gastos, apilados a la derecha del hero — cada uno
          compacto: icono + label/número en una sola fila, no dos. */}
      <div className="grid grid-cols-1 gap-4">
        <motion.div variants={fadeInUp} className="card flex items-center gap-3 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft">
            <TrendingUp className="h-4 w-4 text-accent" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Ingresos</p>
            <AnimatedNumber
              value={ingresosMes}
              format="currency"
              className="block text-lg font-bold tabular-nums text-slate-900"
            />
          </div>
          <DeltaBadge delta={ingresosDelta} upIsGood />
        </motion.div>

        <motion.div variants={fadeInUp} className="card flex items-center gap-3 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
            <Receipt className="h-4 w-4 text-slate-500" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Gastos</p>
            <AnimatedNumber
              value={gastosMes}
              format="currency"
              className="block text-lg font-bold tabular-nums text-slate-900"
            />
          </div>
          <DeltaBadge delta={gastosDelta} upIsGood={false} />
        </motion.div>
      </div>
    </motion.div>
  )
}
