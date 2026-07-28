import Link from 'next/link'
import { Building2, CalendarClock, CreditCard, ShieldCheck } from 'lucide-react'
import { getCurrentClient } from '@/lib/supabase/server'
import { getClientStoreSummaries } from '@/lib/stores'
import { LogoutButton } from '@/components/LogoutButton'
import { StatusBadge } from '@/components/StatusBadge'
import { ChangePasswordForm } from '@/components/ChangePasswordForm'
import { RotateStoreTokenButton } from '@/components/RotateStoreTokenButton'
import { CancelSubscriptionButton } from '@/components/CancelSubscriptionButton'
import { SupportLink } from '@/components/SupportLink'
import { Reveal } from '@/components/Reveal'
import { subscriptionStatusInfo } from '@/lib/status-colors'
import { formatCurrency, formatDate } from '@/lib/format'
import { PLAN_INFO } from '@/lib/plans'
import { getSubscriptionSummary } from '@/lib/subscription'

// Depende de la sesión (cookies) — nunca prerenderizar como página estática.
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  // dashboard/layout.tsx ya garantiza que hay client antes de renderizar
  // esta página (redirige/bloquea antes si no lo hay), pero getCurrentClient
  // está en cache() de React — llamarla aquí no repite la consulta real.
  const client = await getCurrentClient()
  if (!client) return null

  const stores = await getClientStoreSummaries()
  const status = subscriptionStatusInfo(client.estado_suscripcion)
  const planInfo = PLAN_INFO[client.plan]

  // Estado de facturación leído en vivo de Stripe: clients.estado_suscripcion
  // no basta aquí, porque una suscripción ya cancelada a fin de periodo sigue
  // siendo 'activa' hasta que vence (ver src/lib/subscription.ts).
  const subscription = await getSubscriptionSummary()
  const periodEndLabel = subscription?.currentPeriodEnd
    ? formatDate(subscription.currentPeriodEnd)
    : null
  const cancelScheduled = subscription?.cancelAtPeriodEnd ?? false

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Configuración de la cuenta
        </h2>
        <p className="text-sm text-slate-500">Tus datos, tiendas conectadas y suscripción</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">Cuenta</h3>
        <Reveal className="card grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</p>
            <p className="mt-1 text-sm text-slate-900">{client.userEmail ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Suscripción</p>
            <div className="mt-1.5">
              <StatusBadge label={status.label} tone={status.tone} />
            </div>
          </div>
        </Reveal>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">Membresía</h3>
        <Reveal delay={0.05} className="card p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft">
              <CreditCard className="h-4 w-4 text-accent" strokeWidth={2} />
            </span>
            <div>
              <p className="bg-gradient-accent bg-clip-text text-lg font-semibold text-transparent">
                {formatCurrency(planInfo.priceValue)}/mes
              </p>
              <p className="text-sm text-slate-500">
                Plan {planInfo.label} ·{' '}
                {planInfo.maxStores === null
                  ? 'tiendas ilimitadas'
                  : `${stores.length} de ${planInfo.maxStores} tiendas`}
                {' — '}
                <Link href="/precios" className="font-medium text-accent hover:underline">
                  cambiar plan
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Cliente desde
                </p>
                <p className="mt-1 text-sm text-slate-900">{formatDate(client.fecha_alta)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {cancelScheduled ? 'Acceso hasta' : 'Próxima renovación'}
                </p>
                <p className={`mt-1 text-sm ${periodEndLabel ? 'text-slate-900' : 'text-slate-500'}`}>
                  {periodEndLabel ?? 'No disponible'}
                </p>
              </div>
            </div>
          </div>

          {cancelScheduled ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Tu suscripción está cancelada y no se renovará
              {periodEndLabel ? ` el ${periodEndLabel}` : ''}. Mantienes el acceso completo hasta
              esa fecha —{' '}
              <Link href="/precios" className="font-medium underline">
                vuelve a suscribirte
              </Link>{' '}
              cuando quieras.
            </p>
          ) : (
            subscription && <CancelSubscriptionButton periodEndLabel={periodEndLabel} />
          )}
        </Reveal>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">Seguridad</h3>
        <Reveal delay={0.1} className="card p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft">
              <ShieldCheck className="h-4 w-4 text-accent" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">Contraseña</p>
              <p className="text-xs text-slate-500">
                Actualiza la contraseña de acceso a tu cuenta.
              </p>
              <div className="mt-3">
                <ChangePasswordForm />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Tiendas conectadas
        </h3>
        <Reveal delay={0.15} className="card p-6">
          {stores.length === 0 && (
            <p className="text-sm text-slate-500">No tienes ninguna tienda conectada todavía.</p>
          )}

          {stores.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {stores.map((store) => (
                <li key={store.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                    <Building2 className="h-4 w-4 text-accent" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{store.nombre}</p>
                    <p className="truncate text-xs text-slate-500">{store.url_tienda}</p>
                    <div className="mt-2">
                      <RotateStoreTokenButton storeId={store.id} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">Soporte</h3>
        <Reveal delay={0.2} className="card flex items-center justify-between gap-4 p-6">
          <div>
            <p className="text-sm font-medium text-slate-900">¿Necesitas ayuda?</p>
            <p className="text-xs text-slate-500">Escríbenos y te respondemos lo antes posible.</p>
          </div>
          <SupportLink email={process.env.CONTACT_TO_EMAIL} />
        </Reveal>
      </section>

      <LogoutButton />
    </div>
  )
}
