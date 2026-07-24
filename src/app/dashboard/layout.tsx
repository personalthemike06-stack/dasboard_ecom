import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'
import { getCurrentClient, getCurrentUser } from '@/lib/supabase/server'
import { getClientStoreOptions, getSelectedStore } from '@/lib/stores'
import { LogoutButton } from '@/components/LogoutButton'
import { DashboardNav } from '@/components/DashboardNav'
import { StoreSelector } from '@/components/StoreSelector'
import { PageTransition } from '@/components/PageTransition'
import { SubscriptionBlocked } from '@/components/SubscriptionBlocked'

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

  // Sesión válida pero sin fila en client_users (alta a medias, o el link se
  // rompió). Deliberadamente NO se redirige a /login aquí: el middleware
  // rebota /login → /dashboard para cualquier sesión autenticada, así que un
  // redirect('/login') en este caso sería un bucle infinito. Se muestra un
  // mensaje en su lugar, con salida a cerrar sesión.
  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="card w-full max-w-sm space-y-3 p-8 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Cuenta sin vincular</h1>
          <p className="text-sm text-slate-500">
            Tu sesión es válida, pero este usuario no está vinculado a ninguna cuenta de
            Healzyp Analytics todavía. Contacta con soporte para completar el alta.
          </p>
          <LogoutButton />
        </div>
      </div>
    )
  }

  // Plan único, sin distinción básico/premium: el acceso a TODO el dashboard
  // (no solo páginas concretas) depende únicamente de si la suscripción está
  // al día. 'activa'/'prueba' entran con normalidad; 'cancelada'/
  // 'pago_fallido' ven un aviso de renovación en vez del dashboard entero —
  // ni siquiera se piden las tiendas, no hace falta con el dashboard bloqueado.
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

  return (
    <div className="min-h-screen bg-background text-slate-900">
      <header className="px-6 pt-6">
        <div className="flex items-center justify-between pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-accent text-sm font-bold text-white">
              H
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Healzyp Analytics
              </h1>
              <p className="text-xs text-slate-400">{client.nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StoreSelector stores={storeOptions} selectedStoreId={selectedStore?.id ?? null} />
            <Link
              href="/dashboard/settings"
              aria-label="Configuración de la cuenta"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              <Settings className="h-4 w-4" strokeWidth={2} />
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      {/* Menú flotante: separado del borde superior por el pt-6 del header y
          por su propio padding, con sombra + borde propios (.card) en vez de
          una barra plana pegada al borde de la pantalla. */}
      <div className="px-6 pb-6">
        <div className="card inline-flex p-1.5">
          <DashboardNav />
        </div>
      </div>
      <main className="px-6 pb-6">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  )
}
