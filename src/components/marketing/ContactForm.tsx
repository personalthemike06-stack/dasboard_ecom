'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { STATUS_COLORS } from '@/lib/status-colors'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft'

const MOTIVO_OPTIONS = [
  { value: 'producto', label: 'Dudas del producto' },
  { value: 'facturacion', label: 'Facturación' },
  { value: 'otro', label: 'Otro' },
] as const

type Motivo = (typeof MOTIVO_OPTIONS)[number]['value']

export function ContactForm() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [motivo, setMotivo] = useState<Motivo>('producto')
  const [mensaje, setMensaje] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, motivo, mensaje }),
      })

      const body = (await res.json().catch(() => null)) as { error?: string } | null

      if (!res.ok) {
        setError(body?.error ?? 'No se pudo enviar el mensaje. Inténtalo de nuevo.')
        setSending(false)
        return
      }

      setSent(true)
    } catch {
      setError('No se pudo enviar el mensaje. Revisa tu conexión e inténtalo de nuevo.')
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-3 rounded-[24px] bg-white p-8 text-center shadow-[0_30px_60px_rgba(15,23,42,0.12)]">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
          <CheckCircle2 className="h-6 w-6 text-accent" strokeWidth={2} />
        </span>
        <h2 className="text-lg font-semibold text-slate-900">Mensaje enviado</h2>
        <p className="text-sm text-slate-500">Gracias por escribirnos — te respondemos lo antes posible.</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-[24px] bg-white p-8 shadow-[0_30px_60px_rgba(15,23,42,0.12)]"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-600" htmlFor="nombre">
            Nombre
          </label>
          <input
            id="nombre"
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-600" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="block text-sm font-medium text-slate-600">Motivo</span>
        <div className="inline-flex flex-wrap items-center gap-1 rounded-full bg-slate-100 p-1">
          {MOTIVO_OPTIONS.map((opt) => {
            const active = opt.value === motivo
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMotivo(opt.value)}
                aria-pressed={active}
                className={
                  active
                    ? 'rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-white'
                    : 'rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900'
                }
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-600" htmlFor="mensaje">
          Mensaje
        </label>
        <textarea
          id="mensaje"
          required
          rows={5}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className={`${inputClass} resize-none`}
        />
      </div>

      {error && (
        <p className="text-sm" style={{ color: STATUS_COLORS.critical }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3.5 text-sm font-semibold text-white transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? 'Enviando…' : 'Enviar mensaje'}
        <ArrowRight className="h-4 w-4" strokeWidth={2} />
      </button>
    </form>
  )
}
