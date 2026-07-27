import { Users } from 'lucide-react'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { EmptyState } from '@/components/EmptyState'
import { describePage } from '@/lib/page-types'

export type PageNow = { path: string; count: number }

/**
 * "Quién está dónde ahora" — una mini-tarjeta por página, con cuántas
 * sesiones activas tienen esa página como su vista más reciente (mismo
 * criterio que activeNow.byPage de GET /api/dashboard/stats).
 *
 * Recibe `pages` siempre como prop, tanto en /dashboard (datos reales del
 * Server Component padre) como en /devtest (datos simulados) — un único
 * camino de datos. El color/icono de cada tarjeta sale de describePage()
 * (src/lib/page-types.ts), que clasifica la ruta real en un tipo de página
 * (home, producto, checkout…) de forma puramente visual.
 *
 * title/subtitle son opcionales (con el texto de Contador como valor por
 * defecto) para que otras páginas puedan reutilizar el mismo lenguaje
 * visual con su propio encabezado, sin duplicar el marcado.
 */
export function PagesNowCard({
  pages,
  title = 'Quién está dónde ahora',
  subtitle = 'Última página vista por cada sesión activa',
}: {
  pages: PageNow[]
  title?: string
  subtitle?: string
}) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-400">{subtitle}</p>

      {pages.length === 0 ? (
        <div className="mt-2">
          <EmptyState icon={Users} title="Sin actividad en este momento" />
        </div>
      ) : (
        <div className={`mt-4 grid grid-cols-2 gap-3 ${pages.length > 3 ? 'sm:grid-cols-3' : ''}`}>
          {pages.map((p) => {
            const page = describePage(p.path)
            const Icon = page.icon
            return (
              <div key={p.path} className="rounded-xl border border-slate-100 p-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: page.bg }}
                >
                  <Icon className="h-4 w-4" style={{ color: page.text }} strokeWidth={2} />
                </span>
                <p className="mt-2 truncate text-xs font-medium text-slate-600">{page.label}</p>
                <AnimatedNumber
                  value={p.count}
                  format="integer"
                  className="mt-0.5 block text-2xl font-bold tabular-nums"
                  style={{ color: page.text }}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
