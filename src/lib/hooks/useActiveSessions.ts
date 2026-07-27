'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type ActiveSessionRow = {
  id: string
  device_type: string | null
  country: string | null
  city: string | null
}

export type ConnStatus = 'connecting' | 'live' | 'offline'

/**
 * Sesiones activas en los últimos 5 minutos (mismo criterio que
 * /api/analytics/live en el repo de la tienda: created_at reciente Y
 * (ended_at is null O ended_at reciente)).
 *
 * Se usa desde el contador (/dashboard) y el mapa (/dashboard/map) — cada
 * página monta su propia instancia del hook (nunca están montadas a la vez),
 * así que no hace falta un context/store global, solo esta función compartida
 * para no duplicar la query y la suscripción Realtime en dos sitios.
 */
export function useActiveSessions() {
  const [rows, setRows] = useState<ActiveSessionRow[]>([])
  const [status, setStatus] = useState<ConnStatus>('connecting')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchActive = useCallback(async () => {
    const supabase = createClient()
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('tracking_sessions')
      .select('id, device_type, country, city')
      .gte('created_at', fiveMinAgo)
      .or(`ended_at.is.null,ended_at.gte.${fiveMinAgo}`)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setErrorMsg(null)
    setRows(data ?? [])
    setUpdatedAt(new Date())
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchActive()

    const supabase = createClient()
    const channel = supabase
      .channel('dashboard-active-sessions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tracking_sessions' },
        () => fetchActive()
      )
      .subscribe((subStatus) => {
        if (subStatus === 'SUBSCRIBED') setStatus('live')
        else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(subStatus)) {
          setStatus('offline')
        }
      })

    const interval = setInterval(fetchActive, 20000)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [fetchActive])

  return { rows, status, updatedAt, errorMsg }
}
