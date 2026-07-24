'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { SegmentedControl } from '@/components/SegmentedControl'

const OPTIONS: { value: string; label: string }[] = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
]

export function FinancePeriodSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('period') ?? 'month'

  function setPeriod(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <SegmentedControl layoutId="finance-period-pill" options={OPTIONS} value={current} onChange={setPeriod} />
  )
}
