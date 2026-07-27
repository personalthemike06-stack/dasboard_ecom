'use client'

import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { easeOut } from '@/lib/motion-variants'

/**
 * Extraído de sobre-nosotros/page.tsx: `motion.*` requiere 'use client', y
 * la página no puede serlo (exporta `metadata`, que Next.js solo admite en
 * Server Components) — así que solo la parte que de verdad necesita motion
 * vive en su propio componente cliente, en vez de arrastrar toda la página.
 */
export function HeroIntro() {
  return (
    <>
      <motion.span
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3.5 py-1.5 text-xs font-semibold text-accent"
      >
        <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
        Nuestra historia
      </motion.span>

      <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
        Nacimos de una tienda
        <br />
        <motion.span
          initial={{ backgroundPosition: '200% 50%' }}
          animate={{ backgroundPosition: '0% 50%' }}
          transition={{ duration: 1.4, ease: easeOut, delay: 0.15 }}
          className="bg-gradient-accent bg-clip-text text-transparent"
          style={{ backgroundSize: '200% 100%' }}
        >
          de verdad, no de una idea
        </motion.span>
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut, delay: 0.1 }}
        className="mx-auto mt-6 max-w-lg text-lg text-slate-500"
      >
        Healzyp Analytics empezó como la necesidad de saber cómo iba Healzyp, nuestra propia
        tienda, sin abrir cinco paneles distintos cada mañana.
      </motion.p>
    </>
  )
}
