import Link from 'next/link'

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/sobre-nosotros', label: 'Sobre nosotros' },
  { href: '/precios', label: 'Precios' },
  { href: '/contacto', label: 'Contacto' },
]

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-900/[0.06] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-12 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-accent text-xs font-bold text-white">
            H
          </div>
          <span className="text-sm font-semibold text-slate-900">Healzyp Analytics</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-500 transition-colors hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} Healzyp Analytics
        </p>
      </div>
    </footer>
  )
}
