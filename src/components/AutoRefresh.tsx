'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Sustituye el push de Supabase Realtime (imposible ahora: el navegador de
 * este dashboard no tiene acceso a la Supabase de ninguna tienda, ver
 * src/lib/store-api.ts) por polling — refresca la ruta actual cada
 * intervalMs, lo que vuelve a ejecutar el fetch server-side de la página.
 * No expone ningún token al navegador: el fetch a la API de la tienda sigue
 * pasando por el Server Component, esto solo dispara que se repita.
 */
export function AutoRefresh({ intervalMs }: { intervalMs: number }) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs])

  return null
}
