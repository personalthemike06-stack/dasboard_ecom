'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export type FaqItem = { question: string; answer: string }

// Animación de altura con grid-rows (0fr → 1fr) en vez de max-height con un
// valor fijo — se adapta a cualquier longitud de respuesta sin recortar ni
// dejar espacio de sobra, sin medir el DOM a mano.
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="divide-y divide-slate-100 overflow-hidden rounded-[24px] bg-white shadow-[0_30px_60px_rgba(15,23,42,0.08)]">
      {items.map((item, i) => {
        const open = openIndex === i
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="text-sm font-medium text-slate-900">{item.question}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${
                  open ? 'rotate-180' : ''
                }`}
                strokeWidth={2}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-sm text-slate-500">{item.answer}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
