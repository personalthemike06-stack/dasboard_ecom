import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Activity, Globe2, Package, Boxes, Wallet, Check, X, Smartphone, Monitor } from 'lucide-react'
import { ScrollReveal } from '@/components/marketing/ScrollReveal'
import { CountUpOnView } from '@/components/marketing/CountUpOnView'

export const metadata: Metadata = {
  title: 'Healzyp Analytics — Analítica en tiempo real para tu tienda online',
  description:
    'Sesiones activas, mapa de visitantes, pedidos, productos y financiero de tu tienda, en un panel en tiempo real. Conecta tu tienda sin migrar de plataforma.',
}

const FEATURES = [
  {
    icon: Activity,
    title: 'Contador en vivo',
    description: 'Sesiones activas ahora mismo y en qué página está cada una — no un resumen de ayer.',
  },
  {
    icon: Globe2,
    title: 'Mapa de sesiones',
    description: 'De qué país y ciudad viene tu tráfico en directo, sobre un globo interactivo.',
  },
  {
    icon: Package,
    title: 'Pedidos',
    description: 'Todos tus pedidos, su estado y el detalle de cada uno, sin entrar al panel de tu tienda.',
  },
  {
    icon: Boxes,
    title: 'Productos',
    description: 'Stock y estado de tu catálogo, con lo más vendido siempre a la vista.',
  },
  {
    icon: Wallet,
    title: 'Financiero',
    description: 'Ingresos, gastos y beneficio real, con tendencia — sin montar una hoja de cálculo aparte.',
  },
]

const COMPARISON = [
  {
    ours: 'Un precio fijo, sin escalones que suben con tus pedidos o tus visitas.',
    theirs: 'Tarifas que crecen con tu volumen de ventas, aunque no uses más funciones.',
  },
  {
    ours: 'Conecta tu tienda tal cual está — sin migrar de plataforma ni de proveedor.',
    theirs: 'Muchas herramientas de analítica de pago exigen su propio ecosistema o integración profunda.',
  },
  {
    ours: 'Sesiones activas y quién está en cada página, en directo, ahora mismo.',
    theirs: 'La mayoría de paneles nativos resumen una vez al día, no en tiempo real.',
  },
  {
    ours: 'Pensado desde el principio para vender: pedidos y financiero, no solo tráfico web.',
    theirs: 'Las herramientas de analítica genéricas miran visitas, no tu cuenta de resultados.',
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <ScrollReveal y={16}>
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
              Tu tienda,{' '}
              <span className="bg-gradient-accent bg-clip-text text-transparent">en tiempo real</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-slate-500">
              Sesiones activas, mapa de visitantes, pedidos, productos y financiero de tu tienda
              online, en un único panel que se actualiza solo. Conecta tu tienda tal cual está, sin
              migrar de nada.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/precios"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-95 active:scale-[0.98]"
              >
                Ver precios
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              <Link
                href="/sobre-nosotros"
                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
              >
                Cómo empezó Healzyp Analytics →
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1} y={16}>
            {/* Vista previa ilustrativa — no son datos reales de nadie, ver
                caption explícito abajo. */}
            <div className="rounded-[24px] bg-gradient-accent p-8 shadow-2xl shadow-accent/25">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase">
                  Activos ahora
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                  En vivo
                </span>
              </div>

              <CountUpOnView
                value={128}
                className="mt-6 block text-center text-[52px] leading-none font-bold text-white"
              />

              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-white/85">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4" strokeWidth={2} />
                  81 móvil
                </span>
                <span className="flex items-center gap-1.5">
                  <Monitor className="h-4 w-4" strokeWidth={2} />
                  47 escritorio
                </span>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              Vista previa ilustrativa del Contador en vivo — no son datos reales.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Características */}
      <section className="border-t border-slate-900/[0.06] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Todo lo que necesitas saber de tu tienda, en un sitio
            </h2>
            <p className="mt-4 text-slate-500">
              Cinco vistas, un solo panel — nada de saltar entre pestañas ni exportar hojas de
              cálculo.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <ScrollReveal key={feature.title} delay={(i % 3) * 0.08} className="card p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft">
                  <feature.icon className="h-5 w-5 text-accent" strokeWidth={2} />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{feature.description}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Comparativa */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            ¿Por qué no el panel nativo de tu tienda?
          </h2>
          <p className="mt-4 text-slate-500">
            Sin exagerar — esto es lo que de verdad cambia frente al panel de analítica que ya
            trae tu plataforma, o una herramienta genérica de analítica web.
          </p>
        </ScrollReveal>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ScrollReveal delay={0.05} className="card p-8">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft">
                <Check className="h-3.5 w-3.5 text-accent" strokeWidth={3} />
              </span>
              Con Healzyp Analytics
            </h3>
            <ul className="mt-5 space-y-4">
              {COMPARISON.map((row) => (
                <li key={row.ours} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.5} />
                  {row.ours}
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={0.1} className="rounded-2xl border border-slate-900/[0.06] bg-slate-50 p-8">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200">
                <X className="h-3.5 w-3.5 text-slate-500" strokeWidth={3} />
              </span>
              Con herramientas genéricas
            </h3>
            <ul className="mt-5 space-y-4">
              {COMPARISON.map((row) => (
                <li key={row.theirs} className="flex items-start gap-2.5 text-sm text-slate-500">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={2.5} />
                  {row.theirs}
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-slate-900/[0.06] bg-white">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Conecta tu tienda en unos minutos
            </h2>
            <p className="mx-auto mt-4 max-w-md text-slate-500">
              Sin permanencia, un solo precio. Empieza a ver tu tienda en tiempo real hoy mismo.
            </p>
            <Link
              href="/precios"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-95 active:scale-[0.98]"
            >
              Ver precios
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
