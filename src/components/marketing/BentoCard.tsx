'use client'

import { motion } from 'motion/react'
import { easeOut } from '@/lib/motion-variants'

/**
 * Módulo de un bento grid: entrada por scroll (fade + slide-up, una vez) +
 * elevación al hover, en el mismo motion.div — framer-motion compone ambos
 * gestos sobre el mismo estado de animación sin pisarse (a diferencia de
 * mezclar una clase CSS estática de transform con motion en el mismo
 * elemento, que sí compite — ver PricingCard.tsx). El hover lleva su propio
 * `transition` más corto y sin el delay de entrada, para que se sienta
 * inmediato en vez de perezoso.
 */
export function BentoCard({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: easeOut, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: easeOut } }}
      className={`rounded-2xl transition-shadow duration-300 hover:shadow-lg ${className}`}
    >
      {children}
    </motion.div>
  )
}
