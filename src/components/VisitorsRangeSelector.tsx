'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { SegmentedControl } from '@/components/SegmentedControl'

const PRESETS = [
  { value: 'today', label: 'Hoy' },
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: 'custom', label: 'Personalizado' },
]

const inputClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft'

export function VisitorsRangeSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const range = searchParams.get('vrange') ?? '7d'

  function setRange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('vrange', value)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function setCustomDate(key: 'vfrom' | 'vto', value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('vrange', 'custom')
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SegmentedControl
        layoutId="visitors-range-pill"
        options={PRESETS}
        value={range}
        onChange={setRange}
      />

      {range === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={searchParams.get('vfrom') ?? ''}
            onChange={(e) => setCustomDate('vfrom', e.target.value)}
            className={inputClass}
          />
          <span className="text-sm text-slate-400">→</span>
          <input
            type="date"
            value={searchParams.get('vto') ?? ''}
            onChange={(e) => setCustomDate('vto', e.target.value)}
            className={inputClass}
          />
        </div>
      )}
    </div>
  )
}
