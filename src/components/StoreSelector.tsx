'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus, Store as StoreIcon } from 'lucide-react'
import { SELECTED_STORE_COOKIE_NAME } from '@/lib/cookies'

type StoreOption = { id: string; nombre: string }

/**
 * Selector de tienda arriba del sidebar. La selección se guarda en una
 * cookie de un año (no httpOnly: no es sensible, solo un id de una tienda
 * que ya es del propio cliente — ver comentario en src/lib/stores.ts sobre
 * por qué manipularla no es un vector de acceso a datos ajenos) y se
 * refresca la ruta actual para que los Server Components vuelvan a leerla.
 *
 * Sigue siendo un <select> nativo por debajo (accesible, sin dependencia
 * nueva) — el icono/chevron son capas puramente visuales superpuestas.
 *
 * Sin conexión de ninguna tienda, no hay selector que mostrar — pero el
 * enlace para conectar una sigue ahí, es la única forma de salir de ese
 * estado.
 */
export function StoreSelector({
  stores,
  selectedStoreId,
  atStoreLimit = false,
}: {
  stores: StoreOption[]
  selectedStoreId: string | null
  /** Plan del cliente ya al límite de tiendas — el botón "+" enlaza a
   * /precios en vez de a /dashboard/stores/new (esa página también lo
   * comprueba por su cuenta, esto es solo para no ni siquiera ofrecer el
   * camino equivocado desde el sidebar). */
  atStoreLimit?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    document.cookie = `${SELECTED_STORE_COOKIE_NAME}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    startTransition(() => {
      router.refresh()
    })
  }

  const connectHref = atStoreLimit ? '/precios' : '/dashboard/stores/new'
  const connectLabel =
    stores.length === 0 ? 'Conectar tienda' : atStoreLimit ? 'Límite de tiendas alcanzado — mejora tu plan' : 'Nueva tienda'

  return (
    <div className="flex items-center gap-1.5">
      {stores.length > 0 && (
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md bg-accent-soft">
            <StoreIcon className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
          </span>
          <select
            value={selectedStoreId ?? ''}
            onChange={handleChange}
            disabled={pending || stores.length <= 1}
            aria-label="Tienda seleccionada"
            className="w-full appearance-none truncate rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-7 text-sm font-medium text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft disabled:opacity-50"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            strokeWidth={2}
            aria-hidden
          />
        </div>
      )}

      <Link
        href={connectHref}
        aria-label={connectLabel}
        title={connectLabel}
        className={
          stores.length === 0
            ? 'inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50'
            : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
        }
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        {stores.length === 0 && 'Conectar tienda'}
      </Link>
    </div>
  )
}
