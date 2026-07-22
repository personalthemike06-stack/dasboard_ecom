'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Stats = { active: number; mobile: number; desktop: number }
type ConnStatus = 'connecting' | 'live' | 'offline'

const STATUS_CONFIG: Record<ConnStatus, { color: string; label: string }> = {
  connecting: { color: '#898781', label: 'Conectando…' },
  live: { color: '#0ca30c', label: 'En vivo' },
  offline: { color: '#d03b3b', label: 'Reconectando…' },
}

function LiveBadge({ status }: { status: ConnStatus }) {
  const { color, label } = STATUS_CONFIG[status]
  return (
    <span className="flex items-center gap-1.5 text-xs text-neutral-400">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {label}
    </span>
  )
}

/**
 * Contador de sesiones activas en los últimos 5 minutos.
 *
 * Mismo criterio que /api/analytics/live en el proyecto de la tienda
 * (created_at reciente Y (ended_at is null O ended_at reciente)), pero
 * consultado directamente con la anon key: requiere la política RLS de
 * database/dashboard-rls.sql aplicada en Supabase.
 *
 * Se refresca por dos vías: Supabase Realtime (postgres_changes sobre
 * tracking_sessions) para reaccionar a sesiones nuevas/cerradas al instante,
 * y un temporizador de 20s porque la ventana de "últimos 5 min" también se
 * reduce por el simple paso del tiempo, sin que llegue ningún evento nuevo.
 */
export function ActiveUsersCounter() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [status, setStatus] = useState<ConnStatus>('connecting')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchActive = useCallback(async () => {
    const supabase = createClient()
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('tracking_sessions')
      .select('id, device_type')
      .gte('created_at', fiveMinAgo)
      .or(`ended_at.is.null,ended_at.gte.${fiveMinAgo}`)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setErrorMsg(null)
    const rows = data ?? []
    setStats({
      active: rows.length,
      mobile: rows.filter((r) => r.device_type === 'mobile').length,
      desktop: rows.filter((r) => r.device_type === 'desktop').length,
    })
    setUpdatedAt(new Date())
  }, [])

  useEffect(() => {
    // Carga inicial al montar, además de la suscripción Realtime de abajo:
    // patrón estándar de "fetch on mount", no un bucle de renders en cascada.
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

  return (
    <div className="max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">Usuarios activos ahora</p>
        <LiveBadge status={status} />
      </div>

      <p className="mt-2 text-6xl font-semibold text-neutral-50">
        {stats ? stats.active : '—'}
      </p>

      {stats && (
        <p className="mt-3 text-sm text-neutral-500">
          {stats.mobile} móvil · {stats.desktop} escritorio
        </p>
      )}

      {updatedAt && (
        <p className="mt-1 text-xs text-neutral-600">
          Actualizado {updatedAt.toLocaleTimeString('es-ES')}
        </p>
      )}

      {errorMsg && (
        <p className="mt-3 text-xs text-red-400">
          Error leyendo tracking_sessions: {errorMsg}. Comprueba que la
          política RLS de database/dashboard-rls.sql está aplicada.
        </p>
      )}
    </div>
  )
}
