import { Activity } from 'lucide-react'
import { AnimatedNumber } from '@/components/AnimatedNumber'

type DeviceCount = { device: string; count: number }

/**
 * Ya no es 'use client' ni usa useActiveSessions(): los datos vienen del
 * Server Component padre (GET /api/dashboard/stats de la tienda
 * seleccionada, vía AutoRefresh + router.refresh() cada 20s en vez de
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
    <div className="card max-w-md p-8">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft">
          <Activity className="h-4 w-4 text-accent" strokeWidth={2} />
        </span>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Usuarios activos ahora
        </p>
      </div>

      <AnimatedNumber
        value={sessions}
        format="integer"
        className="bg-gradient-accent mt-4 block bg-clip-text text-6xl font-bold tracking-tight text-transparent"
      />

      <p className="mt-3 text-sm text-slate-500">
        {mobile} móvil · {desktop} escritorio
      </p>

      <p className="mt-1 text-xs text-slate-400">
        Actualizado {new Date(generatedAt).toLocaleTimeString('es-ES')}
      </p>
    </div>
  )
}
