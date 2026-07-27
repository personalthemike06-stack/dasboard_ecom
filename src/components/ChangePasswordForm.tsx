'use client'

import { useMemo, useState, useTransition } from 'react'
import { CheckCircle2, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { STATUS_COLORS } from '@/lib/status-colors'
import { getPasswordRequirements } from '@/lib/password-requirements'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft'

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const requirements = useMemo(() => getPasswordRequirements(password), [password])
  const passwordValid = requirements.every((r) => r.met)

  function resetForm() {
    setPassword('')
    setConfirmPassword('')
    setErrorMsg(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setSaved(false)

    if (!passwordValid) {
      const missing = requirements.filter((r) => !r.met).map((r) => r.label)
      setErrorMsg(`La contraseña debe incluir: ${missing.join(', ')}.`)
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las dos contraseñas no coinciden.')
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        // Nunca error.message crudo de Supabase — mismo criterio que ya
        // aplicamos en LoginForm.tsx: un mensaje traducido y genérico, no el
        // texto en inglés de la API.
        setErrorMsg('No se pudo actualizar la contraseña. Inténtalo de nuevo.')
        return
      }

      setSaved(true)
      setPassword('')
      setConfirmPassword('')
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
      >
        Cambiar contraseña
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-500" htmlFor="new-password">
          Nueva contraseña
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />

        {password.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
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

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-500" htmlFor="confirm-password">
          Confirma la nueva contraseña
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      {errorMsg && (
        <p className="text-xs" style={{ color: STATUS_COLORS.critical }}>
          {errorMsg}
        </p>
      )}

      {saved && (
        <p
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium"
          style={{ color: STATUS_COLORS.good, backgroundColor: '#e7f6e7' }}
        >
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
          Contraseña actualizada correctamente.
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-gradient-accent rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:brightness-105 disabled:opacity-50"
        >
          {pending ? 'Guardando…' : 'Guardar contraseña'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            resetForm()
            setSaved(false)
          }}
          className="rounded-md px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
