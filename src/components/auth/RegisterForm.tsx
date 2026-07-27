'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, MailCheck, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { STATUS_COLORS } from '@/lib/status-colors'
import { getPasswordRequirements } from '@/lib/password-requirements'

const inputWrapClass = 'relative'
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft'
const inputIconClass = 'pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400'

/**
 * signUp() SOLO crea el usuario en Supabase Auth — a propósito, NO crea
 * clients/client_users aquí. Esa fila se crea únicamente cuando el webhook
 * de Stripe confirma el pago (checkout.session.completed), para no dejar
 * cuentas "fantasma" sin suscripción en la tabla clients. El nombre se
 * guarda en options.data (user_metadata) precisamente porque no hay fila de
 * `clients` todavía donde ponerlo — el webhook lo leerá de ahí al crearla.
 *
 * Tras registrarse, si Supabase devuelve sesión (confirmación de email
 * desactivada) se pasa directo a /precios ya autenticado, como pide el
 * flujo. Si el proyecto tiene confirmación de email activada, no hay sesión
 * todavía — se avisa de revisar el correo en vez de redirigir en falso.
 */
export function RegisterForm() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const requirements = useMemo(() => getPasswordRequirements(password), [password])
  const passwordValid = requirements.every((r) => r.met)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) {
      setError('Cuéntanos tu nombre.')
      return
    }
    if (!passwordValid) {
      const missing = requirements.filter((r) => !r.met).map((r) => r.label)
      setError(`La contraseña debe incluir: ${missing.join(', ')}.`)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre: nombre.trim() } },
    })

    if (signUpError) {
      setError(
        signUpError.message === 'User already registered'
          ? 'Ya existe una cuenta con ese email — inicia sesión.'
          : 'No se pudo crear la cuenta. Inténtalo de nuevo.'
      )
      setLoading(false)
      return
    }

    // Supabase no siempre devuelve un error explícito para un email ya
    // registrado (por diseño, para no filtrar qué emails existen) — la
    // señal es un usuario con identities vacío en vez de una excepción.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError('Ya existe una cuenta con ese email — inicia sesión.')
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/precios')
      router.refresh()
      return
    }

    setNeedsConfirmation(true)
    setLoading(false)
  }

  if (needsConfirmation) {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
          <MailCheck className="h-6 w-6 text-accent" strokeWidth={2} />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Revisa tu email</h1>
          <p className="mt-1 text-sm text-slate-500">
            Te hemos enviado un enlace para confirmar tu cuenta. Una vez confirmada, inicia sesión
            para elegir tu plan.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-accent hover:underline"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-slate-500">Elige tu plan en el siguiente paso.</p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-600" htmlFor="nombre">
          Nombre
        </label>
        <div className={inputWrapClass}>
          <User className={inputIconClass} strokeWidth={2} />
          <input
            id="nombre"
            type="text"
            required
            autoComplete="name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={inputClass}
          />
        </div>
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
        <label className="block text-sm font-medium text-slate-600" htmlFor="password">
          Contraseña
        </label>
        <div className={inputWrapClass}>
          <Lock className={inputIconClass} strokeWidth={2} />
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {password.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
            {requirements.map((req) => (
              <li key={req.label} className="flex items-center gap-1.5 text-xs">
                {req.met ? (
                  <Check className="h-3.5 w-3.5 shrink-0" style={{ color: STATUS_COLORS.good }} strokeWidth={2.5} />
                ) : (
                  <X className="h-3.5 w-3.5 shrink-0 text-slate-300" strokeWidth={2.5} />
                )}
                <span className={req.met ? 'text-slate-600' : 'text-slate-400'}>{req.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? 'Creando cuenta…' : 'Crear cuenta y elegir plan'}
      </button>

      <p className="text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}
