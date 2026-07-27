import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SELECTED_STORE_COOKIE_NAME } from '@/lib/cookies'

export type Store = {
  id: string
  nombre: string
  url_tienda: string
  api_token: string
  activa: boolean
  fecha_conexion: string
}

export type StoreOption = { id: string; nombre: string }

export type StoreSummary = { id: string; nombre: string; url_tienda: string }

/**
 * Tiendas del cliente autenticado, CON api_token — para uso puramente
 * server-side (llamar a la API de la tienda seleccionada). No pasar nunca el
 * resultado de esta función, ni un campo suyo derivado del token, como prop
 * a un Client Component: el payload RSC que cruza al navegador incluiría el
 * secreto aunque el componente no lo renderice. Para listar tiendas en UI
 * (el dropdown), usa getClientStoreOptions() en su lugar.
 *
 * RLS (client_select_own_stores en database/saas-schema.sql) ya acota esto a
 * las suyas — no hace falta filtrar por client_id aquí.
 *
 * Envuelto en cache() de React: dashboard/layout.tsx y cada layout de página
 * premium (finance/orders/products) llaman a getCurrentClient()/estas
 * funciones de forma independiente; cache() deduplica la consulta real a
 * Supabase dentro del mismo render, no la vuelve a disparar por cada layout.
 */
export const getClientStores = cache(async (): Promise<Store[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('id, nombre, url_tienda, api_token, activa, fecha_conexion')
    .order('fecha_conexion', { ascending: true })

  if (error || !data) return []
  return data
})

/**
 * Igual que getClientStores() pero sin api_token — para el dropdown de
 * StoreSelector (Client Component). Consulta aparte en vez de derivar del
 * resultado de getClientStores() para que el token ni siquiera salga de
 * Supabase cuando lo único que hace falta es la lista de nombres.
 */
export const getClientStoreOptions = cache(async (): Promise<StoreOption[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('id, nombre')
    .order('fecha_conexion', { ascending: true })

  if (error || !data) return []
  return data
})

/**
 * Igual que getClientStoreOptions() pero con url_tienda además del nombre —
 * para /dashboard/settings (mostrar nombre + URL de cada tienda conectada).
 * Sigue sin traer api_token, por la misma razón que getClientStoreOptions().
 */
export const getClientStoreSummaries = cache(async (): Promise<StoreSummary[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('id, nombre, url_tienda')
    .order('fecha_conexion', { ascending: true })

  if (error || !data) return []
  return data
})

/**
 * Tienda seleccionada vía cookie, o la primera si no hay cookie o no
 * corresponde a ninguna tienda del cliente. Como `stores` ya viene acotado
 * por RLS a las tiendas del cliente autenticado, una cookie manipulada con
 * el id de una tienda ajena simplemente no hace match con ninguna entrada y
 * cae al fallback — no es un vector de acceso a datos de otro cliente.
 */
export async function getSelectedStore(): Promise<Store | null> {
  const stores = await getClientStores()
  if (stores.length === 0) return null

  const cookieStore = await cookies()
  const selectedId = cookieStore.get(SELECTED_STORE_COOKIE_NAME)?.value

  return stores.find((s) => s.id === selectedId) ?? stores[0]
}
