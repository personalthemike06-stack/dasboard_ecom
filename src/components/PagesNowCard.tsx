import { AnimatedNumber } from '@/components/AnimatedNumber'

export type PageNow = { path: string; count: number }

/**
 * "Quién está dónde ahora" — una fila por página, con cuántas sesiones
 * activas tienen esa página como su vista más reciente (mismo criterio que
 * activeNow.byPage de GET /api/dashboard/stats, calculado en la plantilla
 * con la misma lógica que tenía usePagesNow aquí).
 *
 * Ya no es 'use client' ni tiene modo mock aparte: recibe `pages` siempre
 * como prop, tanto en /dashboard (datos reales del Server Component padre)
 * como en /devtest (datos simulados) — un único camino de datos.
 *
 * title/subtitle son opcionales (con el texto de Contador como valor por
 * defecto) para que Mapa pueda reutilizar el mismo lenguaje visual
 * (barra de progreso + AnimatedNumber) con su propio encabezado, sin
 * duplicar el marcado.
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
  const maxCount = Math.max(1, ...pages.map((p) => p.count))

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-400">{subtitle}</p>

      <ul className="mt-4 space-y-3">
        {pages.map((p) => (
          <li key={p.path}>
            <div className="flex items-center justify-between text-sm">
              <span className="truncate text-slate-700">{p.path}</span>
              <AnimatedNumber
                value={p.count}
                format="integer"
                className="ml-2 shrink-0 font-semibold tabular-nums text-slate-900"
              />
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
                style={{ width: `${(p.count / maxCount) * 100}%` }}
              />
            </div>
          </li>
        ))}

        {pages.length === 0 && (
          <li className="text-sm text-slate-400">Nadie navegando ahora mismo.</li>
        )}
      </ul>
    </div>
  )
}
