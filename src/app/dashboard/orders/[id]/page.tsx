import { redirect } from 'next/navigation'

// El detalle de un pedido ahora se abre como drawer desde /dashboard/orders
// (OrdersGrid → OrderDetailDrawer, vía /api/orders/[id]) en vez de vivir en
// su propia URL — esta ruta se mantiene solo para no romper enlaces/
// marcadores antiguos a /dashboard/orders/[id].
export default function OrderDetailRedirect() {
  redirect('/dashboard/orders')
}
