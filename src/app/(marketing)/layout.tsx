import { PublicHeader } from '@/components/marketing/PublicHeader'
import { PublicFooter } from '@/components/marketing/PublicFooter'

// font-sans (→ var(--font-geist-sans), ya cargada en layout.tsx raíz pero
// sin usar hasta ahora: el body global fuerza Arial a propósito para el
// dashboard, ver globals.css). Geist ya se descarga sin coste extra —
// activarla solo aquí, en vez de tocar el body global, mantiene el
// dashboard exactamente igual y le da a la web pública una tipografía con
// más personalidad para títulos grandes.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
