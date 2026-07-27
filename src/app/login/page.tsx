import type { Metadata } from 'next'
import { Activity, Globe2, Wallet } from 'lucide-react'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar sesión — Healzyp Analytics',
}

const BULLETS = [
  { icon: Activity, text: 'Sesiones activas en tiempo real' },
  { icon: Globe2, text: 'De dónde viene tu tráfico, en directo' },
  { icon: Wallet, text: 'Ingresos, gastos y beneficio real' },
]

export default function LoginPage() {
  return (
    <AuthPageShell>
      <AuthBrandPanel
        title="Tu tienda, en tiempo real"
        subtitle="Sesiones activas, pedidos y financiero — todo donde lo dejaste."
        bullets={BULLETS}
      />
      <div className="order-last flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 md:order-none md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </AuthPageShell>
  )
}
