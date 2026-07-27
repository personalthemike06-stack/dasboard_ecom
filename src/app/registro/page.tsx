import type { Metadata } from 'next'
import { Zap, Sparkles, Shield } from 'lucide-react'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Crea tu cuenta — Healzyp Analytics',
}

const BULLETS = [
  { icon: Zap, text: 'Conecta tu tienda en 5 minutos' },
  { icon: Sparkles, text: 'Un precio simple, sin escalones' },
  { icon: Shield, text: 'Sin permanencia — cancela cuando quieras' },
]

// Panel invertido respecto a /login (formulario primero, marca después) —
// mismo AuthPageShell/AuthBrandPanel; el orden visual en desktop (formulario
// a la izquierda, marca a la derecha) sale solo del orden de los hijos en
// el grid. En móvil, AuthBrandPanel se fuerza a order-first internamente,
// así que sigue apareciendo arriba pese a ser el segundo hijo aquí.
export default function RegistroPage() {
  return (
    <AuthPageShell>
      <div className="order-last flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 md:order-none md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <RegisterForm />
        </div>
      </div>
      <AuthBrandPanel
        title="Empieza en minutos"
        subtitle="Conecta tu tienda y ve tus datos en tiempo real desde el primer día."
        bullets={BULLETS}
      />
    </AuthPageShell>
  )
}
