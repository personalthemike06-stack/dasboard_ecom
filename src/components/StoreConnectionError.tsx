import { PlugZap } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'

/**
 * Estado de error compartido cuando falla la llamada a la API de la tienda
 * seleccionada (red, timeout, token inválido...). `message` ya viene
 * traducido por src/lib/store-api.ts — nunca un error crudo de fetch.
 */
export function StoreConnectionError({ message }: { message: string }) {
  return <EmptyState icon={PlugZap} title="No se pudo conectar con la tienda" description={message} />
}
