'use client'

import { motion } from 'motion/react'
import { easeOut } from '@/lib/motion-variants'

/**
 * Fade + slide-up al entrar en el viewport (no al montar, como Reveal.tsx
 * del dashboard) — pensado para secciones largas de una landing donde el
 * usuario hace scroll, no para contenido que ya está visible al cargar.
 * viewport once:true — se anima una vez y se queda, no repite al volver a
 * hacer scroll hacia arriba (una landing no es un dashboard con datos que
 * cambian, repetir la animación cada vez que cruza el viewport sería ruido).
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: easeOut, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
