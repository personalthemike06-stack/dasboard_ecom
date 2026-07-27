// Paleta de estado fija (no temática) — la misma en todo el dashboard para
// que "verde" y "rojo" signifiquen siempre lo mismo entre pedidos, productos
// y financiero. Nunca se usa color solo: siempre va con icono/etiqueta.
export const STATUS_COLORS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
  neutral: '#898781',
} as const

export type StatusTone = keyof typeof STATUS_COLORS

// Fondo tenue a juego con cada tono, para que StatusBadge tenga algo más de
// presencia que un pill blanco con solo un puntito de color.
export const STATUS_SOFT_COLORS = {
  good: '#e7f6e7',
  warning: '#fef3da',
  serious: '#fce8e0',
  critical: '#fbe4e4',
  neutral: '#f1f0ee',
} as const

// orders.estado real (order_status_enum en supabase/schema.sql de la tienda,
// valores en español): pendiente, pagado, fallido, procesando, enviado,
// entregado, cancelado, reembolsado. Un solo enum combinado — la tienda real
// no separa "estado del pedido" de "estado de pago" en dos columnas, así que
// aquí tampoco hay paymentStatusInfo.
const ORDER_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  pendiente: { label: 'Pendiente', tone: 'neutral' },
  pagado: { label: 'Pagado', tone: 'good' },
  fallido: { label: 'Pago fallido', tone: 'critical' },
  procesando: { label: 'Procesando', tone: 'warning' },
  enviado: { label: 'Enviado', tone: 'good' },
  entregado: { label: 'Entregado', tone: 'good' },
  cancelado: { label: 'Cancelado', tone: 'critical' },
  reembolsado: { label: 'Reembolsado', tone: 'serious' },
}

export function orderStatusInfo(estado: string) {
  return ORDER_STATUS[estado] ?? { label: estado, tone: 'neutral' as StatusTone }
}

// clients.estado_suscripcion (client_subscription_status_enum en
// database/saas-schema.sql). 'activa' y 'prueba' dan acceso al dashboard
// (ver dashboard/layout.tsx); 'cancelada' y 'pago_fallido' lo bloquean.
const SUBSCRIPTION_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  activa: { label: 'Activa', tone: 'good' },
  prueba: { label: 'Periodo de prueba', tone: 'warning' },
  cancelada: { label: 'Cancelada', tone: 'critical' },
  pago_fallido: { label: 'Pago fallido', tone: 'critical' },
}

export function subscriptionStatusInfo(estado: string) {
  return SUBSCRIPTION_STATUS[estado] ?? { label: estado, tone: 'neutral' as StatusTone }
}
