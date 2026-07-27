'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { STATUS_COLORS } from '@/lib/status-colors'

const CATEGORIES = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'herramientas', label: 'Herramientas' },
  { value: 'envios', label: 'Envíos' },
  { value: 'otros', label: 'Otros' },
]

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft'

const today = () => new Date().toISOString().slice(0, 10)

export function NewExpenseForm({ storeId }: { storeId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [fecha, setFecha] = useState(today())
  const [importe, setImporte] = useState('')
  const [categoria, setCategoria] = useState('otros')
  const [descripcion, setDescripcion] = useState('')
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(savedTimeout.current), [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    const amount = Number(importe)
    if (!fecha || !Number.isFinite(amount) || amount < 0) {
      setErrorMsg('Revisa la fecha y el importe.')
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from('dashboard_expenses').insert({
        store_id: storeId,
        fecha,
        importe: amount,
        categoria,
        descripcion: descripcion || null,
      })

      if (error) {
        setErrorMsg(error.message)
        return
      }

      setImporte('')
      setDescripcion('')
      setSaved(true)
      clearTimeout(savedTimeout.current)
      savedTimeout.current = setTimeout(() => setSaved(false), 3000)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-500" htmlFor="fecha">
            Fecha
          </label>
          <input
            id="fecha"
            type="date"
            required
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-500" htmlFor="importe">
            Importe (€)
          </label>
          <input
            id="importe"
            type="number"
            step="0.01"
            min="0"
            required
            value={importe}
            onChange={(e) => setImporte(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-500" htmlFor="categoria">
          Categoría
        </label>
        <select
          id="categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className={inputClass}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-500" htmlFor="descripcion">
          Descripción (opcional)
        </label>
        <input
          id="descripcion"
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
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
          Gasto añadido correctamente.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-gradient-accent w-full rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:brightness-105 disabled:opacity-50"
      >
        {pending ? 'Guardando…' : 'Añadir gasto'}
      </button>
    </form>
  )
}
