'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type TopPage = { path: string; viewCount: number }

/**
 * Páginas más vistas en los últimos 5 minutos, mismo criterio que
 * topPages en /api/analytics/live (repo de la tienda). Solo polling (sin
 * canal Realtime propio): es un panel secundario junto al mapa, no necesita
 * reaccionar al instante como el contador de sesiones.
 */
export function useTopPages() {
  const [pages, setPages] = useState<TopPage[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchTopPages = useCallback(async () => {
    const supabase = createClient()
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('tracking_page_views')
      .select('path, created_at')
      .gte('created_at', fiveMinAgo)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setErrorMsg(null)
    const counts = new Map<string, number>()
    for (const row of data ?? []) {
      counts.set(row.path, (counts.get(row.path) ?? 0) + 1)
    }
    setPages(
      Array.from(counts.entries())
        .map(([path, viewCount]) => ({ path, viewCount }))
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 8)
    )
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTopPages()
    const interval = setInterval(fetchTopPages, 20000)
    return () => clearInterval(interval)
  }, [fetchTopPages])

  return { pages, errorMsg }
}
