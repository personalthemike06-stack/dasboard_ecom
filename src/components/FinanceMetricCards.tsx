'use client'

import { motion } from 'motion/react'
import { Receipt, TrendingUp, Wallet } from 'lucide-react'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { Sparkline } from '@/components/Sparkline'
import { DeltaBadge } from '@/components/DeltaBadge'
import { STATUS_COLORS } from '@/lib/status-colors'
import { staggerContainer, fadeInUp } from '@/lib/motion-variants'
import type { Delta } from '@/lib/finance'

export function FinanceMetricCards({
  ingresosMes,
  gastosMes,
  beneficioMes,
  ingresosDelta,
  gastosDelta,
  beneficioDelta,
  ingresosSpark,
  gastosSpark,
}: {
  ingresosMes: number
  gastosMes: number
  beneficioMes: number
  ingresosDelta: Delta | null
  gastosDelta: Delta | null
  beneficioDelta: Delta | null
  ingresosSpark: number[]
  gastosSpark: number[]
}) {
  const beneficioGood = beneficioMes >= 0

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      <motion.div variants={fadeInUp} className="card p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft">
            <TrendingUp className="h-4 w-4 text-accent" strokeWidth={2} />
          </span>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Ingresos</p>
        </div>
        <AnimatedNumber
          value={ingresosMes}
          format="currency"
          className="bg-gradient-accent mt-3 block bg-clip-text text-3xl font-bold tabular-nums text-transparent"
        />
        <div className="mt-2">
          <DeltaBadge delta={ingresosDelta} upIsGood />
        </div>
        <div className="mt-3 -mb-1">
          <Sparkline data={ingresosSpark} color="#3b82f6" />
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} className="card p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
            <Receipt className="h-4 w-4 text-slate-500" strokeWidth={2} />
          </span>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Gastos</p>
        </div>
        <AnimatedNumber
          value={gastosMes}
          format="currency"
          className="mt-3 block text-3xl font-bold tabular-nums text-slate-900"
        />
        <div className="mt-2">
          <DeltaBadge delta={gastosDelta} upIsGood={false} />
        </div>
        <div className="mt-3 -mb-1">
          <Sparkline data={gastosSpark} color="#eb6834" />
        </div>
      </motion.div>

      {/* La tarjeta "hero" del trío: fondo propio (no blanco puro) + badge
          más grande, para que se lea de un vistazo como la métrica que de
          verdad importa, no solo una tercera cifra más. */}
      <motion.div
        variants={fadeInUp}
        className="card p-5"
        style={{
          backgroundColor: beneficioGood ? '#f2faf2' : '#fdf3f3',
          border: `1px solid ${beneficioGood ? '#cdeccd' : '#f4cccc'}`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: beneficioGood ? '#d7f0d7' : '#f8d7d7' }}
          >
            <Wallet
              className="h-5 w-5"
              style={{ color: beneficioGood ? STATUS_COLORS.good : STATUS_COLORS.critical }}
              strokeWidth={2.25}
            />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Beneficio · mes actual
          </p>
        </div>
        <AnimatedNumber
          value={beneficioMes}
          format="currency"
          className="mt-3 block text-5xl font-extrabold tabular-nums"
          style={{ color: beneficioGood ? STATUS_COLORS.good : STATUS_COLORS.critical }}
        />
        <div className="mt-2">
          <DeltaBadge delta={beneficioDelta} upIsGood />
        </div>
      </motion.div>
    </motion.div>
  )
}
