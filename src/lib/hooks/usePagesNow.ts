'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type PageNow = { path: string; count: number }

/**
 * En qué página está cada sesión activa (últimos 5 min) AHORA MISMO — no
 * "cuántas veces se ha visto cada página" (eso ya lo hace useTopPages). Para
 * cada sesión activa se toma solo su tracking_page_views más reciente, y se
 * agrupan las sesiones (personas) por esa página. Con Realtime, igual que
 * useActiveSessions: cualquier sesión o page_view nuevo dispara un refetch.
 */
export function usePagesNow() {
  const [pages, setPages] = useState<PageNow[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchPagesNow = useCallback(async () => {
    const supabase = createClient()
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: sessions, error: sessionsError } = await supabase
      .from('tracking_sessions')
      .select('id')
      .gte('created_at', fiveMinAgo)
      .or(`ended_at.is.null,ended_at.gte.${fiveMinAgo}`)

    if (sessionsError) {
      setErrorMsg(sessionsError.message)
      return
    }

    const sessionIds = (sessions ?? []).map((s) => s.id as string)
    if (sessionIds.length === 0) {
      setErrorMsg(null)
      setPages([])
      return
    }

    const { data: views, error: viewsError } = await supabase
      .from('tracking_page_views')
      .select('session_id, path, created_at')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (viewsError) {
      setErrorMsg(viewsError.message)
      return
    }

    setErrorMsg(null)

    // Ordenado desc por created_at, así que la primera vez que aparece cada
    // session_id es, por construcción, su page_view más reciente.
    const latestPathBySession = new Map<string, string>()
    for (const row of views ?? []) {
      if (!latestPathBySession.has(row.session_id)) {
        latestPathBySession.set(row.session_id, row.path)
      }
    }

    const counts = new Map<string, number>()
    for (const path of latestPathBySession.values()) {
      counts.set(path, (counts.get(path) ?? 0) + 1)
    }

    setPages(
      Array.from(counts.entries())
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
    )
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPagesNow()

    const supabase = createClient()
    const channel = supabase
      .channel('dashboard-pages-now')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracking_page_views' }, () =>
        fetchPagesNow()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracking_sessions' }, () =>
        fetchPagesNow()
      )
      .subscribe()

    const interval = setInterval(fetchPagesNow, 20000)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [fetchPagesNow])

  return { pages, errorMsg }
}
