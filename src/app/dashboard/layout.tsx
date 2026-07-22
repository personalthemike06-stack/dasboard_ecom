import { redirect } from 'next/navigation'
import { getCurrentAdminUser } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/LogoutButton'

// Depende de la sesión de cada request (cookies) y de datos en vivo — nunca
// debe prerenderizarse como página estática en build time.
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Defensa en profundidad: el middleware ya redirige a /login si no hay
  // sesión admin, pero un Server Component nunca debe confiar solo en eso.
  const admin = await getCurrentAdminUser()
  if (!admin) redirect('/login')

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">Healzyp Analytics</h1>
          <p className="text-xs text-neutral-500">{admin.email}</p>
        </div>
        <LogoutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
