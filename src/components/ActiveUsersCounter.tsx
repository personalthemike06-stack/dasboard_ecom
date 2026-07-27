import { Monitor, Smartphone } from 'lucide-react'
import { AnimatedNumber } from '@/components/AnimatedNumber'

type DeviceCount = { device: string; count: number }

/**
 * Ya no es 'use client' ni usa useActiveSessions(): los datos vienen del
 * Server Component padre (GET /api/dashboard/stats de la tienda
 * seleccionada, vía AutoRefresh + router.refresh() cada 30s en vez de
 * Realtime — ver src/components/AutoRefresh.tsx).
 *
 * byDevice es opcional (no solo por tipo): getStoreStats() en
 * src/lib/store-api.ts ya normaliza la respuesta y garantiza un array, pero
 * este componente no debe depender SOLO de esa garantía externa — un JSON
 * real que cruza HTTP desde un repo desplegado por separado (la tienda)
 * puede no coincidir con lo que dice el tipo. Sin este fallback, byDevice
 * undefined revienta en `.find()` con "Cannot read properties of undefined"
 * (pasó de verdad antes de este fix).
 */
export function ActiveUsersCounter({
  sessions,
  byDevice = [],
  generatedAt,
}: {
  sessions: number
  byDevice?: DeviceCount[]
  generatedAt: string
}) {
  const mobile = byDevice.find((d) => d.device === 'mobile')?.count ?? 0
  const desktop = byDevice.find((d) => d.device === 'desktop')?.count ?? 0

  return (
    <div className="rounded-[18px] p-8" style={{ backgroundColor: 'var(--accent)' }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
        >
          Activos ahora
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
          En vivo
        </span>
      </div>

      <AnimatedNumber
        value={sessions}
        format="integer"
        className="mt-6 block text-center text-[52px] leading-none font-bold tracking-tight text-white"
      />

      <div className="mt-6 flex items-center justify-center gap-6 text-sm text-white/85">
        <span className="flex items-center gap-1.5">
          <Smartphone className="h-4 w-4" strokeWidth={2} />
          {mobile} móvil
        </span>
        <span className="flex items-center gap-1.5">
          <Monitor className="h-4 w-4" strokeWidth={2} />
          {desktop} escritorio
        </span>
      </div>

      <p className="mt-3 text-center text-xs text-white/60">
        Actualizado {new Date(generatedAt).toLocaleTimeString('es-ES')}
      </p>
    </div>
  )
}
