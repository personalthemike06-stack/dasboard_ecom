'use client'

import { motion } from 'motion/react'

/**
 * Envoltorio de entrada reutilizable para que Server Components (páginas del
 * dashboard) puedan animar secciones sin tener que marcarse enteras 'use
 * client' — framer-motion no se auto-declara 'use client' en su build, así
 * que cualquier uso de motion.* necesita su propio archivo cliente. `children`
 * sí puede venir de un Server Component: React lo trata como un slot, no
 * como una prop función, así que cruza la frontera sin problema.
 */
export function Reveal({
  children,
  className,
  style,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}
