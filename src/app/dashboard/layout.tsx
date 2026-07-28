import { redirect } from 'next/navigation'
import { getCurrentClient, getCurrentUser } from '@/lib/supabase/server'
import { getClientStoreOptions, getSelectedStore } from '@/lib/stores'
import { LogoutButton } from '@/components/LogoutButton'
import { Sidebar } from '@/components/Sidebar'
import { PageTransition } from '@/components/PageTransition'
import { SubscriptionBlocked } from '@/components/SubscriptionBlocked'
import { AwaitingSubscription } from '@/components/AwaitingSubscription'
import { PLAN_INFO } from '@/lib/plans'

// Depende de la sesión de cada request (cookies) y de datos en vivo — nunca
// debe prerenderizarse como página estática en build time.
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Defensa en profundidad: el middleware ya redirige a /login si no hay
  // sesión, pero un Server Component nunca debe confiar solo en eso.
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const client = await getCurrentClient()

  // Sesión válida pero sin fila en client_users. Deliberadamente NO se
  // redirige a /login aquí: el middleware rebota /login → /dashboard para
  // cualquier sesión autenticada, así que un redirect('/login') en este caso
  // sería un bucle infinito. Se muestra un mensaje en su lugar.
  //
  // Este es el caso NORMAL y esperado para cualquier usuario recién
  // registrado que confirmó su email pero aún no eligió plan (ver diseño en
  // RegisterForm.tsx: signUp() nunca crea clients/client_users, eso lo hace
  // el webhook de Stripe tras el pago) — no una cuenta rota. El copy y el CTA
  // reflejan eso: empujar a /precios, no a soporte.
  if (!client) {
    return <AwaitingSubscription />
  }

  // El acceso a TODO el dashboard depende primero de si la suscripción está
  // al día, sin importar el plan (clients.plan, ver src/lib/plans.ts):
  // 'activa'/'prueba' entran con normalidad; 'cancelada'/'pago_fallido' ven
  // un aviso de renovación en vez del dashboard entero — ni siquiera se
  // piden las tiendas, no hace falta con el dashboard bloqueado. El plan en
  // sí SÍ gatea qué páginas se ven además del límite de tiendas —
  // Contador/Mapa/Financiero son de pago (planHasFullAccess() en
  // src/lib/plans.ts); ese bloqueo vive en dashboard/page.tsx y en los
  // layout.tsx de dashboard/finance y dashboard/map, no aquí.
  if (client.estado_suscripcion === 'cancelada' || client.estado_suscripcion === 'pago_fallido') {
    return (
      <div className="min-h-screen bg-background text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
                H
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Healzyp Analytics</h1>
                <p className="text-xs text-slate-400">{client.nombre}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className="flex min-h-[calc(100vh-73px)] items-center justify-center p-6">
          <SubscriptionBlocked estado={client.estado_suscripcion} />
        </main>
      </div>
    )
  }

  const [storeOptions, selectedStore] = await Promise.all([
    getClientStoreOptions(),
    getSelectedStore(),
  ])

  const maxStores = PLAN_INFO[client.plan].maxStores
  const atStoreLimit = maxStores !== null && storeOptions.length >= maxStores

  return (
    <div className="min-h-screen bg-background text-slate-900">
      <Sidebar
        clientName={client.nombre}
        storeOptions={storeOptions}
        selectedStoreId={selectedStore?.id ?? null}
        atStoreLimit={atStoreLimit}
        plan={client.plan}
      />
      <main className="px-6 py-6 lg:pl-[calc(var(--sidebar-width)+1.5rem)]">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  )
}
