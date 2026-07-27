import Link from 'next/link'
import { Lock } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'

/**
 * Aviso de bloqueo por plan — se muestra en vez del contenido real de
 * Contador, Mapa o Financiero cuando el cliente está en plan Básico (ver
 * planHasFullAccess() en src/lib/plans.ts). Mismo patrón visual que
 * NoStoreConnected: EmptyState + un único CTA.
 */
export function UpgradeNotice({ feature }: { feature: string }) {
  return (
    <EmptyState
      icon={Lock}
      title={`${feature} es una función de los planes Premium y Ultra`}
      description="Mejora tu plan para desbloquear esta página — tus datos siguen ahí, solo hace falta cambiar de plan para verlos."
      action={
        <Link
          href="/precios"
          className="bg-gradient-accent mt-1 rounded-md px-4 py-2 text-sm font-medium text-white transition hover:brightness-105"
        >
          Ver planes
        </Link>
      }
    />
  )
}
