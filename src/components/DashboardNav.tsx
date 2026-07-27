'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { Activity, Globe2, Package, ShoppingBag, Wallet } from 'lucide-react'

const LINKS = [
  { href: '/dashboard', label: 'Contador', icon: Activity },
  { href: '/dashboard/map', label: 'Mapa', icon: Globe2 },
  { href: '/dashboard/orders', label: 'Pedidos', icon: ShoppingBag },
  { href: '/dashboard/products', label: 'Productos', icon: Package },
  { href: '/dashboard/finance', label: 'Financiero', icon: Wallet },
]

// currentPath es opcional — solo para previsualizar el estado activo desde
// /devtest sin depender de la URL real (esas páginas viven fuera de
// /dashboard/*, así que usePathname() nunca marcaría ningún tab). En
// producción siempre se omite y se usa la ruta real.
export function DashboardNav({ currentPath }: { currentPath?: string } = {}) {
  const pathname = usePathname()
  const path = currentPath ?? pathname

  return (
    <nav className="flex gap-1">
      {LINKS.map((link) => {
        const active =
          link.href === '/dashboard'
            ? path === '/dashboard'
            : path.startsWith(link.href)
        const Icon = link.icon

        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? 'relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-accent'
                : 'relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900'
            }
          >
            {active && (
              <motion.span
                layoutId="nav-active-pill"
                className="absolute inset-0 rounded-md bg-accent-soft"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="h-4 w-4" strokeWidth={active ? 2.25 : 2} />
              {link.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
