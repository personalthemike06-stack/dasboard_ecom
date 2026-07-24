import Link from 'next/link'
import { Store } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'

/**
 * Estado vacío compartido por todas las páginas de datos (Contador, y las
 * que se migren después) cuando el cliente no tiene ninguna tienda
 * conectada — para no repetir el mismo bloque en cada una.
 */
export function NoStoreConnected() {
  return (
    <EmptyState
      icon={Store}
      title="Conecta una tienda para ver datos aquí"
      description="Todavía no tienes ninguna tienda conectada a tu cuenta."
      action={
        <Link
          href="/dashboard/stores/new"
          className="bg-gradient-accent mt-1 rounded-md px-4 py-2 text-sm font-medium text-white transition hover:brightness-105"
        >
          Conectar tienda
        </Link>
      }
    />
  )
}
