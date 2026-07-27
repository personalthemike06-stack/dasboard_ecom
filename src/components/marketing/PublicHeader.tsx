'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/sobre-nosotros', label: 'Sobre nosotros' },
  { href: '/precios', label: 'Precios' },
  { href: '/contacto', label: 'Contacto' },
]

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-accent text-sm font-bold text-white">
        H
      </div>
      <span className="hidden text-sm font-semibold text-slate-900 sm:inline">
        Healzyp Analytics
      </span>
    </Link>
  )
}

/**
 * Header público — distinto del Sidebar del dashboard a propósito (nunca
 * comparten componente): flotante en su propia píldora de cristal, no
 * pegado al borde. Vive en (marketing)/layout.tsx, un único componente para
 * las 4 páginas públicas — nunca se duplica por página.
 *
 * grid-cols-[1fr_auto_1fr] en vez de flex justify-between: así el nav
 * central queda REALMENTE centrado en la píldora, no solo "en medio de lo
 * que sobra" — con flex, si el bloque de la izquierda (logo) y el de la
 * derecha (login+registro) no pesan lo mismo, el nav se desplaza hacia el
 * lado más ligero. Con dos columnas 1fr a los lados absorbiendo el espacio
 * sobrante simétricamente, el nav queda centrado de verdad
 * independientemente de la anchura de logo/acciones.
 */
export function PublicHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-4 z-40 px-4">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-full border border-white/50 bg-white/65 px-4 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur-[14px] sm:px-6">
        <div className="justify-self-start">
          <Logo />
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  active ? 'font-semibold text-accent' : 'font-medium text-slate-500 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center justify-self-end gap-2 sm:gap-4">
          <Link
            href="/login"
            className="hidden text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline sm:text-sm"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="rounded-full bg-accent px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-95 active:scale-[0.98] sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Registrarse
          </Link>

          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/[0.04] hover:text-slate-900 md:hidden"
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/30"
          />
          <div className="absolute inset-x-4 top-4 space-y-1 rounded-3xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2">
              <Logo />
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/[0.04] hover:text-slate-900"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-xl px-3 py-2.5 text-sm ${
                    active ? 'font-semibold text-accent' : 'font-medium text-slate-700 hover:bg-slate-900/[0.03]'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-900/[0.03] sm:hidden"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
