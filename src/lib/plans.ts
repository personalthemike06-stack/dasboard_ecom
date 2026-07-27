// Fuente única de precio y límite de tiendas por plan — compartida entre
// /precios (marketing), POST /api/stores (aplicación real del límite) y la
// UI del dashboard (StoreSelector, /dashboard/stores/new,
// /dashboard/settings). Antes de esto, /precios tenía estos mismos números
// escritos a mano y el backend nunca los aplicaba — vivían desincronizados
// sin que nada lo detectara (ver audit funcional). Cambiar un límite ahora
// significa tocar este archivo una vez, no perseguir cada sitio donde se
// repitió el número.

export type ClientPlan = 'basico' | 'premium' | 'ultra'

export type PlanInfo = {
  label: string
  priceValue: number
  /** null = sin límite. */
  maxStores: number | null
}

export const PLAN_INFO: Record<ClientPlan, PlanInfo> = {
  basico: { label: 'Básico', priceValue: 9.99, maxStores: 5 },
  premium: { label: 'Premium', priceValue: 19.99, maxStores: 15 },
  ultra: { label: 'Ultra', priceValue: 29.99, maxStores: null },
}

/** Básico solo ve Pedidos y Productos — Contador, Mapa y Financiero son de
 * pago (premium/ultra). Fuente única para el gating de páginas, igual que
 * PLAN_INFO lo es para precio/límite de tiendas — ver layouts de
 * dashboard/finance y dashboard/map, y la comprobación inline en
 * dashboard/page.tsx (Contador no puede tener layout propio: layout.tsx de
 * /dashboard ya es el shell compartido por todas sus rutas hijas). */
export function planHasFullAccess(plan: ClientPlan): boolean {
  return plan !== 'basico'
}

export function planStoresLabel(plan: ClientPlan): string {
  const { maxStores } = PLAN_INFO[plan]
  return maxStores === null ? 'Tiendas ilimitadas' : `Hasta ${maxStores} tiendas conectadas`
}
