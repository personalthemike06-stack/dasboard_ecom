import type { Metadata } from 'next'
import type { LucideIcon } from 'lucide-react'
import { Mail, Clock, ShieldCheck } from 'lucide-react'
import { ScrollReveal } from '@/components/marketing/ScrollReveal'
import { ContactForm } from '@/components/marketing/ContactForm'
import { FaqAccordion, type FaqItem } from '@/components/marketing/FaqAccordion'

export const metadata: Metadata = {
  title: 'Contacto — Healzyp Analytics',
  description: 'Escríbenos si tienes dudas sobre Healzyp Analytics o necesitas un plan a medida.',
}

const CONTACT_INFO: { icon: LucideIcon; label: string }[] = [
  { icon: Mail, label: 'soporte@healzyp.com' },
  { icon: Clock, label: 'Respuesta en <24h' },
  { icon: ShieldCheck, label: 'Clientes de pago tienen soporte prioritario' },
]

// Copy provisional — pendiente de revisión, no fue redactada a partir de un
// texto ya acordado.
const FAQ_ITEMS: FaqItem[] = [
  {
    question: '¿Tengo que migrar mi tienda a otra plataforma?',
    answer:
      'No. Conectas tu tienda tal cual está, sin migrar de plataforma ni de proveedor — solo necesitas pegar un token en el .env de tu tienda.',
  },
  {
    question: '¿Cuánto tarda en verse mi tienda en el dashboard?',
    answer:
      'En cuanto conectas tu tienda, el Contador en vivo y el resto de páginas empiezan a mostrar datos reales en minutos, sin proceso de importación previo.',
  },
  {
    question: '¿Qué pasa si supero el límite de tiendas de mi plan?',
    answer:
      'Puedes ver los planes disponibles en la página de Precios y contactarnos para actualizar tu suscripción. El límite solo bloquea conectar una tienda nueva, nunca las que ya tienes activas.',
  },
  {
    question: '¿Puedo cancelar cuando quiera?',
    answer:
      'Sí, sin permanencia. Puedes solicitar la cancelación escribiéndonos a soporte@healzyp.com — la resolvemos en menos de 24h. El autoservicio de cancelación desde tu cuenta está en desarrollo.',
  },
  {
    question: '¿Están seguros los datos de mis clientes?',
    answer:
      'Sí. Los datos de pedidos y clientes de tu tienda nunca se guardan en Healzyp Analytics — se piden en vivo a tu propia tienda en cada carga, con un token exclusivo tuyo.',
  },
  {
    question: '¿Ofrecéis soporte prioritario?',
    answer:
      'Los planes Premium y Ultra incluyen soporte prioritario por email. El plan Básico tiene soporte estándar, con la misma respuesta en menos de 24h.',
  },
]

function ContactInfoBlock({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft">
        <Icon className="h-5 w-5 text-accent" strokeWidth={2} />
      </span>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}

export default function ContactoPage() {
  return (
    <section className="relative mx-auto max-w-[560px] px-6 py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),_transparent_70%)]"
      />

      <ScrollReveal y={16} className="text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          ¿En qué podemos ayudarte?
        </h1>
        <p className="mt-6 text-lg text-slate-500">
          Cuéntanos qué necesitas y te respondemos lo antes posible.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.1} className="mt-12">
        <ContactForm />
      </ScrollReveal>

      <ScrollReveal delay={0.15} className="mt-14">
        <h2 className="text-center text-xl font-semibold tracking-tight text-slate-900">
          Preguntas frecuentes
        </h2>
        <div className="mt-6">
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.2} className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {CONTACT_INFO.map((item) => (
          <ContactInfoBlock key={item.label} {...item} />
        ))}
      </ScrollReveal>
    </section>
  )
}
