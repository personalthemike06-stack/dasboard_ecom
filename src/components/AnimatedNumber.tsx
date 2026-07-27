'use client'

import { useEffect, useRef } from 'react'
import { animate } from 'motion/react'
import { formatCurrency } from '@/lib/format'

// 'format' es un string serializable (no una función) a propósito: este
// componente lo renderizan Server Components (finance/page.tsx…), y una
// función no puede cruzar la frontera Server → Client como prop.
type NumberFormat = 'currency' | 'integer'

const integerFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 })

function applyFormat(n: number, format: NumberFormat) {
  return format === 'currency' ? formatCurrency(n) : integerFormatter.format(Math.round(n))
}

/**
 * Cuenta desde el valor anterior hasta el nuevo en vez de saltar de golpe.
 * Escribe directamente en el DOM vía ref en cada frame (onUpdate) en lugar
 * de useState, para no re-renderizar React 60 veces por segundo.
 */
export function AnimatedNumber({
  value,
  format = 'currency',
  className,
  style,
}: {
  value: number
  format?: NumberFormat
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const prevValue = useRef(0)

  useEffect(() => {
    const from = prevValue.current
    const controls = animate(from, value, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        if (ref.current) ref.current.textContent = applyFormat(latest, format)
      },
    })
    prevValue.current = value
    return controls.stop
  }, [value, format])

  return (
    <span ref={ref} className={className} style={style}>
      {applyFormat(0, format)}
    </span>
  )
}
