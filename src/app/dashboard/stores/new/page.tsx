import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getCurrentClient } from '@/lib/supabase/server'
import { getClientStoreOptions } from '@/lib/stores'
import { ConnectStoreForm } from '@/components/ConnectStoreForm'
import { Reveal } from '@/components/Reveal'
import { PLAN_INFO } from '@/lib/plans'

export const dynamic = 'force-dynamic'

export default async function NewStorePage() {
  const client = await getCurrentClient()
  if (!client) redirect('/login')

  const storeOptions = await getClientStoreOptions()
  const planInfo = PLAN_INFO[client.plan]
  const atLimit = planInfo.maxStores !== null && storeOptions.length >= planInfo.maxStores

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-accent hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Contador
      </Link>

      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Conectar tienda nueva</h2>
        <p className="text-sm text-slate-500">
          Ponle un nombre y su URL — el token para el <code>.env</code> de esa tienda
          (<code>DASHBOARD_API_TOKEN</code>) lo generamos nosotros y te lo enseñamos al conectarla.{' '}
          {planInfo.maxStores === null
            ? `${storeOptions.length} tiendas conectadas — ilimitadas en tu plan ${planInfo.label}.`
            : `${storeOptions.length} de ${planInfo.maxStores} tiendas conectadas en tu plan ${planInfo.label}.`}
        </p>
      </div>

      {atLimit ? (
        <Reveal className="card space-y-3 p-6 text-center">
          <p className="text-sm text-slate-600">
            Has alcanzado el límite de {planInfo.maxStores} tiendas de tu plan {planInfo.label}. Mejora tu
            plan para conectar más.
          </p>
          <Link
            href="/precios"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 active:scale-[0.98]"
          >
            Ver planes
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </Reveal>
      ) : (
        <Reveal className="card p-5">
          <ConnectStoreForm />
        </Reveal>
      )}
    </div>
  )
}
