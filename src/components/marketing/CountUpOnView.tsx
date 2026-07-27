'use client'

import { useEffect, useMemo, useRef } from 'react'
import { animate, useInView } from 'motion/react'

/**
 * Cuenta de 0 hasta `value` la primera vez que el elemento entra en el
 * viewport — variante de AnimatedNumber.tsx (dashboard) que dispara al
 * montar, no al hacer scroll. Formatea con Intl 'es-ES', igual que
 * AnimatedNumber/format.ts — coma decimal, no punto, consistente con el
 * resto de la app. prefix/suffix genéricos (no currency/integer): en la
 * landing los números no son siempre dinero (nº de tiendas, nº de páginas
 * del panel...).
 */
export function CountUpOnView({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  className,
}: {
  value: number
  suffix?: string
  prefix?: string
  decimals?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  // Ref, no state: mutar esto NO debe disparar un re-render — si fuera
  // useState, marcarlo dentro del propio efecto lo metería en las deps y
  // provocaría que el efecto se re-ejecutara a sí mismo, matando la
  // animación a los pocos ms (ver bug corregido: los precios se quedaban
  // congelados en un valor minúsculo, no en el precio real).
  const startedRef = useRef(false)

  const formatter = useMemo(
    () => new Intl.NumberFormat('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    [decimals]
  )

  useEffect(() => {
    if (!isInView || startedRef.current || !ref.current) return
    startedRef.current = true

    const node = ref.current
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = `${prefix}${formatter.format(latest)}${suffix}`
      },
    })
    return controls.stop
  }, [isInView, value, prefix, suffix, formatter])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatter.format(0)}
      {suffix}
    </span>
  )
}
