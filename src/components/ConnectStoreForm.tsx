'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { STATUS_COLORS } from '@/lib/status-colors'
import { CopyableField } from '@/components/CopyableField'

const inputClass =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft'

/**
 * El token ya no lo escribe el cliente: lo genera POST /api/stores y se
 * enseña UNA vez aquí. Sin clientId como prop — el endpoint resuelve el
 * cliente por su cuenta a partir de la sesión (cookies), no hay nada que
 * pasarle desde este componente.
 *
 * El id de la tienda (stores.id, ya lo devuelve /api/stores, no hace falta
 * generar nada nuevo) se enseña también: es el valor que va como
 * STORE_INSTANCE_ID en la plantilla, para separar el tracking de esta
 * conexión de otras instancias de la misma tienda (local vs producción)
 * que compartan la misma Supabase — un UUID único por conexión, no un
 * texto libre inventado a mano que podría colisionar entre tiendas.
 */
export function ConnectStoreForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [urlTienda, setUrlTienda] = useState('')
  const [created, setCreated] = useState<{ id: string; apiToken: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (!nombre.trim()) {
      setErrorMsg('Ponle un nombre a la tienda.')
      return
    }

    try {
      new URL(urlTienda)
    } catch {
      setErrorMsg('La URL de la tienda no es válida — incluye https://.')
      return
    }

    startTransition(async () => {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), url_tienda: urlTienda }),
      })

      const body = (await res.json().catch(() => null)) as
        | { id: string; apiToken: string }
        | { error: string }
        | null

      if (!res.ok || !body || !('apiToken' in body)) {
        setErrorMsg(
          body && 'error' in body ? body.error : 'No se pudo conectar la tienda.'
        )
        return
      }

      setCreated(body)
    })
  }

  function handleContinue() {
    router.push('/dashboard')
    router.refresh()
  }

  if (created) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Copia estos dos valores ahora — el token no podrás volver a verlo completo. En el{' '}
          <code>.env</code> de tu tienda, pega el primero como{' '}
          <code className="font-semibold">DASHBOARD_API_TOKEN</code> y el segundo como{' '}
          <code className="font-semibold">STORE_INSTANCE_ID</code>, y haz redeploy.
        </p>

        <CopyableField value={created.apiToken} label="DASHBOARD_API_TOKEN" />
        <CopyableField value={created.id} label="STORE_INSTANCE_ID" />

        <button
          type="button"
          onClick={handleContinue}
          className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition hover:brightness-95"
        >
          Ya los copié, continuar
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-500" htmlFor="nombre">
          Nombre de la tienda
        </label>
        <input
          id="nombre"
          type="text"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Healzyp"
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-500" htmlFor="url">
          URL de la tienda
        </label>
        <input
          id="url"
          type="url"
          required
          value={urlTienda}
          onChange={(e) => setUrlTienda(e.target.value)}
          placeholder="https://healzyp.com"
          className={inputClass}
        />
      </div>

      {errorMsg && (
        <p className="text-xs" style={{ color: STATUS_COLORS.critical }}>
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition hover:brightness-95 disabled:opacity-50"
      >
        {pending ? 'Conectando…' : 'Conectar tienda'}
      </button>
    </form>
  )
}
