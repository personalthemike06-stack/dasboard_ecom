'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { STATUS_COLORS } from '@/lib/status-colors'

const inputWrapClass = 'relative'
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft'
const inputIconClass = 'pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400'

type Mode = 'login' | 'forgot'

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(
        signInError.code === 'email_not_confirmed'
          ? 'Tu cuenta aún no está confirmada. Revisa tu email.'
          : 'Credenciales incorrectas.'
      )
      setLoading(false)
      return
    }

    // Sin comprobación de rol aquí: quién puede entrar a /dashboard lo
    // deciden middleware.ts (¿hay sesión?) y dashboard/layout.tsx (¿esa
    // sesión está vinculada a un cliente vía client_users?) — este
    // formulario solo autentica. Si el usuario no tiene cliente vinculado,
    // dashboard/layout.tsx se lo explica ahí ("Cuenta sin vincular"), no
    // hace falta duplicar esa lógica (ni su mensaje) aquí.
    router.push('/dashboard')
    router.refresh()
  }

  // Reutiliza el "Cambiar contraseña" que ya existe en /dashboard/settings
  // (ChangePasswordForm) en vez de construir una página nueva de "nueva
  // contraseña": el enlace de recuperación deja al usuario con una sesión
  // de recuperación válida justo ahí, donde ya puede fijar una contraseña
  // nueva con el formulario que ya existe.
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard/settings`,
    })

    setLoading(false)
    if (resetError) {
      setError('No se pudo enviar el email. Comprueba la dirección e inténtalo de nuevo.')
      return
    }
    setResetSent(true)
  }

  if (mode === 'forgot') {
    return (
      <form onSubmit={handleForgotPassword} className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Recupera tu contraseña
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Te enviamos un enlace para elegir una nueva.
          </p>
        </div>

        {resetSent ? (
          <p
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium"
            style={{ color: STATUS_COLORS.good, backgroundColor: '#e7f6e7' }}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} />
            Revisa tu email — te hemos enviado el enlace.
          </p>
        ) : (
          <div className={inputWrapClass}>
            <Mail className={inputIconClass} strokeWidth={2} />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!resetSent && (
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
          >
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setMode('login')
            setError(null)
            setResetSent(false)
          }}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          ← Volver a iniciar sesión
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Bienvenido de vuelta</h1>
        <p className="mt-1 text-sm text-slate-500">Inicia sesión en tu cuenta.</p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-600" htmlFor="email">
          Email
        </label>
        <div className={inputWrapClass}>
          <Mail className={inputIconClass} strokeWidth={2} />
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-600" htmlFor="password">
            Contraseña
          </label>
          <button
            type="button"
            onClick={() => {
              setMode('forgot')
              setError(null)
            }}
            className="text-xs font-medium text-accent hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <div className={inputWrapClass}>
          <Lock className={inputIconClass} strokeWidth={2} />
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? 'Entrando…' : 'Entrar'}
      </button>

      <p className="text-center text-sm text-slate-500">
        ¿Aún no tienes cuenta?{' '}
        <Link href="/registro" className="font-medium text-accent hover:underline">
          Suscríbete aquí
        </Link>
      </p>
    </form>
  )
}
