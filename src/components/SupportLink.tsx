import { LifeBuoy } from 'lucide-react'

// Mismo email que se muestra en /contacto y que usa CONTACT_TO_EMAIL para
// el envío real del formulario — un solo sitio al que apunta "soporte" en
// toda la app. mailto: en vez de un canal de Telegram: ese enlace era un
// placeholder sin canal real detrás (ver historial), esto funciona hoy sin
// depender de montar nada nuevo.
const DEFAULT_SUPPORT_EMAIL = 'soporte@healzyp.com'

export function SupportLink({ email = DEFAULT_SUPPORT_EMAIL }: { email?: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="bg-gradient-accent inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:brightness-105"
    >
      <LifeBuoy className="h-4 w-4" strokeWidth={2} />
      Contactar con soporte
    </a>
  )
}
