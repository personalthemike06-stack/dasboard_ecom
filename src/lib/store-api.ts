import { Agent, fetch as undiciFetch, type Response as UndiciResponse } from 'undici'
import type { Store } from '@/lib/stores'
import { isHttpAllowedForHostname, ssrfSafeConnector } from '@/lib/ssrf-guard'

// ─────────────────────────────────────────────────────────────────────────────
// Cliente HTTP hacia GET /api/dashboard/stats (y, más adelante, el resto de
// endpoints) de la tienda seleccionada. SOLO se usa server-side (Server
// Components/Route Handlers) — nunca pases un Store completo (con
// api_token) a un Client Component, ver el comentario en src/lib/stores.ts.
//
// url_tienda lo escribe el propio cliente del SaaS al conectar su tienda
// (POST /api/stores) — sin control sobre qué host acaba ahí. Sin las tres
// defensas de abajo (dispatcher con lookup filtrado, redirect: 'manual',
// límite de tamaño de respuesta) esto era un SSRF de libro: cualquier
// cliente autenticado podía apuntar su "tienda" a 169.254.169.254 o a
// cualquier IP interna y este servidor se lo pedía él solito, cada 20s (ver
// audit-saas-security.md §1). SIEMPRE server-side por eso mismo: nunca
// mover fetchStoreApi ni sus imports a un Client Component.
// ─────────────────────────────────────────────────────────────────────────────

export type StoreApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

const TIMEOUT_MS = 8000
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024 // 2MB — de sobra para cualquier JSON de este API, tope duro contra un cuerpo de respuesta gigante (tienda comprometida, o el propio destino de un intento de SSRF).

// Un único Agent para todas las llamadas a tiendas, con nuestro connector en
// vez del de undici por defecto — filtra tanto IPs literales como hostnames
// que resuelvan a red interna (ver src/lib/ssrf-guard.ts). Instancia de
// módulo (no una por request) para reutilizar el pool de conexiones entre
// llamadas.
const ssrfSafeDispatcher = new Agent({ connect: ssrfSafeConnector })

class ResponseTooLargeError extends Error {}

/** Igual que res.json(), pero corta la lectura si el cuerpo supera maxBytes — por Content-Length si está presente, y por bytes reales leídos en cualquier caso (un servidor puede omitir o mentir sobre Content-Length). */
async function readJsonWithLimit(res: UndiciResponse, maxBytes: number): Promise<unknown> {
  const contentLength = res.headers.get('content-length')
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new ResponseTooLargeError()
  }

  if (!res.body) {
    const text = await res.text()
    if (text.length > maxBytes) throw new ResponseTooLargeError()
    return JSON.parse(text)
  }

  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new ResponseTooLargeError()
    }
    chunks.push(value)
  }

  const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)))
  return JSON.parse(buffer.toString('utf-8'))
}

async function fetchStoreApi<T>(
  store: Pick<Store, 'url_tienda' | 'api_token'>,
  path: string,
  params?: Record<string, string>,
  mutation?: { method: 'PATCH' | 'POST'; body: unknown }
): Promise<StoreApiResult<T>> {
  let url: URL
  try {
    url = new URL(path, store.url_tienda)
  } catch {
    return { ok: false, error: 'La URL de la tienda no es válida.' }
  }
  if (params) {
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  }

  // Repetido en cada llamada real, no solo al conectar la tienda (POST
  // /api/stores) — mismo motivo que el guard SSRF: un hostname puede
  // resolver a loopback ahora y a otra cosa en la próxima petición.
  if (url.protocol === 'http:' && !(await isHttpAllowedForHostname(url.hostname))) {
    return { ok: false, error: 'Esa tienda usa http:// hacia un host que no es localhost — no permitido.' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    // fetch de `undici` a propósito, NO el global de Node/Next: el global
    // también corre sobre undici por dentro, pero es una copia interna
    // distinta de la que trae este paquete — pasarle un Agent construido con
    // el `undici` de npm revienta en runtime ("invalid onRequestStart
    // method", confirmado al probarlo) por desajuste de versión interna.
    // Usando el fetch del propio paquete, Agent y fetch son siempre la misma
    // versión.
    const res = await undiciFetch(url, {
      method: mutation?.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${store.api_token}`,
        ...(mutation ? { 'Content-Type': 'application/json' } : {}),
      },
      body: mutation ? JSON.stringify(mutation.body) : undefined,
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'manual',
      dispatcher: ssrfSafeDispatcher,
    })

    // redirect: 'manual' → Node no sigue el 3xx, lo devuelve tal cual: nunca
    // hay que fiarse de a dónde apunte Location (podría ser justo el interno
    // que el lookup filtrado de arriba bloquearía en la siguiente petición).
    if (res.status >= 300 && res.status < 400) {
      return { ok: false, error: 'La tienda respondió con una redirección — no se sigue por seguridad.' }
    }

    if (res.status === 401) {
      return { ok: false, error: 'Token inválido para esta tienda. Revisa DASHBOARD_API_TOKEN.' }
    }
    if (res.status === 429) {
      return { ok: false, error: 'La tienda está limitando peticiones. Prueba de nuevo en un momento.' }
    }
    if (!res.ok) {
      return { ok: false, error: `La tienda respondió con un error (${res.status}).` }
    }

    return { ok: true, data: (await readJsonWithLimit(res, MAX_RESPONSE_BYTES)) as T }
  } catch (err) {
    if (err instanceof ResponseTooLargeError) {
      return { ok: false, error: 'La tienda respondió con un cuerpo demasiado grande.' }
    }
    const code = (err as NodeJS.ErrnoException | undefined)?.code
    const cause = (err as { cause?: NodeJS.ErrnoException })?.cause
    if (code === 'SSRF_BLOCKED' || cause?.code === 'SSRF_BLOCKED') {
      return { ok: false, error: 'Esa URL de tienda apunta a una dirección no permitida.' }
    }
    const timedOut = err instanceof Error && err.name === 'AbortError'
    return {
      ok: false,
      error: timedOut
        ? 'La tienda tardó demasiado en responder.'
        : 'No se pudo conectar con la tienda. Verifica la URL y el token.',
    }
  } finally {
    clearTimeout(timeout)
  }
}

// ─── Tipos de respuesta de /api/dashboard/stats (healzypp-clean) ────────────

export type StorePageCount = { path: string; count: number }
export type StoreDeviceCount = { device: string; count: number }
export type StoreCountryCount = {
  country: string
  count: number
  cities: { city: string; count: number }[]
}
export type StoreDailyVisitors = { day: string; visitors: number }
export type StoreOrdersByStatus = { estado: string; count: number }
export type StoreTopProduct = {
  productId: string | null
  name: string
  unitsSold: number
  revenue: number
}

export type StoreStatsResponse = {
  range: { from: string; to: string }
  activeNow: {
    sessions: number
    byPage: StorePageCount[]
    byDevice: StoreDeviceCount[]
    byCountry: StoreCountryCount[]
    withoutCountry: number
  }
  visitors: { total: number; byDay: StoreDailyVisitors[] }
  orders: { count: number; byStatus: StoreOrdersByStatus[]; totalRevenue: number }
  topProducts: StoreTopProduct[]
  generatedAt: string
}

export async function getStoreStats(
  store: Pick<Store, 'url_tienda' | 'api_token'>,
  params: { from: string; to: string }
): Promise<StoreApiResult<StoreStatsResponse>> {
  const result = await fetchStoreApi<StoreStatsResponse>(store, '/api/dashboard/stats', params)
  if (!result.ok) return result

  // Defensa en el límite del sistema: esta tienda y este dashboard se
  // despliegan por separado (repos distintos), así que puede haber
  // desajuste de versión — una tienda corriendo un despliegue más antiguo
  // de /api/dashboard/stats no incluiría byDevice/byCountry/withoutCountry
  // (añadidos después de sessions/byPage) en el JSON real, aunque el tipo
  // los declare obligatorios. TypeScript no protege nada en tiempo de
  // ejecución cuando el dato cruza HTTP — sin esto, un .find()/.map() en
  // algún componente revienta con "Cannot read properties of undefined"
  // (pasó de verdad con byDevice en ActiveUsersCounter).
  const activeNow = result.data.activeNow ?? ({} as Partial<StoreStatsResponse['activeNow']>)

  return {
    ok: true,
    data: {
      ...result.data,
      activeNow: {
        sessions: activeNow.sessions ?? 0,
        byPage: activeNow.byPage ?? [],
        byDevice: activeNow.byDevice ?? [],
        byCountry: activeNow.byCountry ?? [],
        withoutCountry: activeNow.withoutCountry ?? 0,
      },
    },
  }
}

// ─── Tipos de respuesta de /api/dashboard/finance-series (healzypp-clean) ───
// Ingresos únicamente (pedidos pagados) — los gastos manuales viven en la
// Supabase de este dashboard (dashboard_expenses, por store_id), no aquí.

export type FinanceSeriesPeriod = 'day' | 'week' | 'month'

export type FinanceSeriesRow = { bucket: string; ingresos: number }

export type FinanceSeriesResponse = {
  period: FinanceSeriesPeriod
  range: { from: string; to: string }
  series: FinanceSeriesRow[]
}

export async function getFinanceSeries(
  store: Pick<Store, 'url_tienda' | 'api_token'>,
  params: { period: FinanceSeriesPeriod; from: string; to: string }
): Promise<StoreApiResult<FinanceSeriesResponse>> {
  return fetchStoreApi<FinanceSeriesResponse>(store, '/api/dashboard/finance-series', params)
}

// ─── Tipos de respuesta de /api/dashboard/orders (healzypp-clean) ───────────
// Deliberadamente SIN datos personales (nombre/email/teléfono/dirección) —
// eso solo vive en /api/dashboard/orders/[id] (ver getOrderDetail más abajo),
// que el dashboard tiene prohibido cachear.

export type StoreOrderListRow = {
  id: string
  numeroPedido: string
  estado: string
  total: number
  fechaCreacion: string
  // Opcional a propósito: este repo y healzypp-clean se despliegan por
  // separado (mismo motivo que activeNow en getStoreStats) — una tienda con
  // un despliegue de /api/dashboard/orders anterior a añadir el conteo de
  // artículos no lo incluiría en el JSON aunque el tipo lo declare.
  itemCount?: number
}

export type StoreOrdersResponse = {
  orders: StoreOrderListRow[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export async function getOrders(
  store: Pick<Store, 'url_tienda' | 'api_token'>,
  params: { status?: string; from?: string; to?: string; limit: number; offset: number }
): Promise<StoreApiResult<StoreOrdersResponse>> {
  const query: Record<string, string> = {
    limit: String(params.limit),
    offset: String(params.offset),
  }
  if (params.status) query.status = params.status
  if (params.from) query.from = params.from
  if (params.to) query.to = params.to

  return fetchStoreApi<StoreOrdersResponse>(store, '/api/dashboard/orders', query)
}

// ─── Tipos de respuesta de /api/dashboard/orders/[id] (healzypp-clean) ──────
// SÍ incluye datos personales del cliente final — excepción explícita del
// diseño para poder gestionar un pedido concreto. Nunca debe cachearse ni
// persistirse en este dashboard (ver el proxy en src/app/api/orders/[id]).

export type StoreOrderItem = {
  id: string
  product_id: string | null
  nombre_producto: string
  cantidad: number
  precio_unitario: number
  precio_total: number
}

export type StoreOrderDetail = {
  id: string
  numero_pedido: string
  email_cliente: string | null
  nombre_cliente: string | null
  telefono_cliente: string | null
  estado: string
  subtotal: number
  descuento: number
  gastos_envio: number
  total: number
  metodo_pago: string | null
  direccion_envio: unknown
  notas_cliente: string | null
  fecha_creacion: string
  fecha_actualizacion: string
  items: StoreOrderItem[]
}

export async function getOrderDetail(
  store: Pick<Store, 'url_tienda' | 'api_token'>,
  orderId: string
): Promise<StoreApiResult<StoreOrderDetail>> {
  return fetchStoreApi<StoreOrderDetail>(store, `/api/dashboard/orders/${orderId}`)
}

// ─── Tipos de respuesta de /api/dashboard/products (healzypp-clean) ─────────
// Catálogo completo (products + bundles) — sin paginación, un catálogo no
// crece sin límite como el histórico de pedidos.

export type StoreProduct = {
  id: string
  nombre: string
  categoria: string | null
  precio: number
  precioOriginal: number | null
  stock: number
  activo: boolean
}

export type StoreBundle = {
  id: string
  nombre: string
  cantidad: number
  precio: number
  porcentajeDto: number | null
  esPopular: boolean
  activo: boolean
  productNombre: string | null
}

export type StoreProductsResponse = {
  products: StoreProduct[]
  bundles: StoreBundle[]
}

export async function getProducts(
  store: Pick<Store, 'url_tienda' | 'api_token'>
): Promise<StoreApiResult<StoreProductsResponse>> {
  return fetchStoreApi<StoreProductsResponse>(store, '/api/dashboard/products')
}

// PATCH /api/dashboard/products/[id] — único mutation del catálogo, body
// SOLO { activo }. Sustituye a la escritura directa que hacía
// ProductActiveToggle contra la Supabase de la tienda (ya no accesible desde
// el navegador del dashboard SaaS, ver src/components/ProductActiveToggle.tsx).
export async function updateProductActive(
  store: Pick<Store, 'url_tienda' | 'api_token'>,
  productId: string,
  activo: boolean
): Promise<StoreApiResult<{ id: string; activo: boolean }>> {
  return fetchStoreApi(store, `/api/dashboard/products/${productId}`, undefined, {
    method: 'PATCH',
    body: { activo },
  })
}
