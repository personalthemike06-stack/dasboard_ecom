'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { Activity, Globe2, Lock, Package, ShoppingBag, Wallet } from 'lucide-react'
import type { ClientPlan } from '@/lib/plans'

const LINKS = [
  { href: '/dashboard', label: 'Contador', icon: Activity, gated: true },
  { href: '/dashboard/map', label: 'Mapa', icon: Globe2, gated: true },
  { href: '/dashboard/orders', label: 'Pedidos', icon: ShoppingBag, gated: false },
  { href: '/dashboard/products', label: 'Productos', icon: Package, gated: false },
  { href: '/dashboard/finance', label: 'Financiero', icon: Wallet, gated: true },
]

// currentPath es opcional — solo para previsualizar el estado activo desde
// /devtest sin depender de la URL real (esas páginas viven fuera de
// /dashboard/*, así que usePathname() nunca marcaría ningún tab). En
// producción siempre se omite y se usa la ruta real.
//
// onNavigate es opcional — el sidebar móvil lo usa para cerrar el drawer al
// elegir una sección; en desktop (sidebar siempre visible) no hace falta.
//
// plan es opcional — solo para el candado de Contador/Mapa/Financiero en
// plan Básico (ver planHasFullAccess en src/lib/plans.ts). El enlace sigue
// llevando a la página real: el candado es un aviso, no un disabled — la
// página de destino es la que de verdad muestra UpgradeNotice.
export function DashboardNav({
  currentPath,
  onNavigate,
  plan,
}: { currentPath?: string; onNavigate?: () => void; plan?: ClientPlan } = {}) {
  const pathname = usePathname()
  const path = currentPath ?? pathname
  const locked = plan === 'basico'

  return (
    <nav className="flex flex-col gap-0.5">
      {LINKS.map((link) => {
        const active =
          link.href === '/dashboard'
            ? path === '/dashboard'
            : path.startsWith(link.href)
        const Icon = link.icon
        const showLock = locked && link.gated

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={
              active
                ? 'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-accent'
                : 'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-900/[0.03] hover:text-slate-900'
            }
          >
            {active && (
              <motion.span
                layoutId="nav-active-pill"
                className="absolute inset-0 rounded-lg bg-accent-soft"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex flex-1 items-center gap-2.5">
              <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 2} />
              {link.label}
              {showLock && (
                <Lock className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2} aria-label="Función de pago" />
              )}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
