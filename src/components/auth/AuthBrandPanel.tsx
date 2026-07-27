import type { LucideIcon } from 'lucide-react'

export type AuthBrandBullet = { icon: LucideIcon; text: string }

/**
 * Panel de marca a pantalla completa — mitad izquierda o derecha del
 * viewport en desktop (columna del grid 50/50 de AuthPageShell). En móvil
 * SIEMPRE aparece arriba como franja compacta (order-first, independiente
 * del orden de los hijos en el DOM que cada página usa para decidir qué
 * mitad ocupa en desktop — login pone el panel primero, registro lo pone
 * segundo; sin este order-first, el panel aparecería abajo en móvil en
 * registro, inconsistente con login). Nunca desaparece del todo: el logo
 * grande se mantiene como ancla de marca incluso en la franja compacta;
 * titular/subtítulo/bullets solo caben con la altura completa de desktop.
 */
export function AuthBrandPanel({
  title,
  subtitle,
  bullets,
}: {
  title: string
  subtitle: string
  bullets: AuthBrandBullet[]
}) {
  return (
    <div className="relative order-first flex h-48 shrink-0 flex-col items-center justify-center gap-3 overflow-hidden bg-gradient-accent px-6 text-center text-white sm:h-60 md:order-none md:h-auto md:items-start md:justify-between md:px-14 md:py-14 md:text-left">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-3 md:items-start">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold text-white shadow-lg backdrop-blur-sm sm:h-20 sm:w-20 sm:text-3xl md:h-24 md:w-24 md:rounded-[28px] md:text-4xl">
          H
        </div>
        <span className="text-sm font-semibold tracking-wide text-white/90 sm:text-base md:mt-4 md:text-lg">
          Healzyp Analytics
        </span>
      </div>

      <div className="relative hidden md:block">
        <h2 className="text-4xl font-bold tracking-tight">{title}</h2>
        <p className="mt-4 max-w-sm text-base text-white/80">{subtitle}</p>
      </div>

      <ul className="relative hidden space-y-4 md:block">
        {bullets.map((bullet) => (
          <li key={bullet.text} className="flex items-center gap-3 text-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
              <bullet.icon className="h-4 w-4" strokeWidth={2} />
            </span>
            {bullet.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
