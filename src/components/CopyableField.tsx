'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

/** Un valor con su propio botón "Copiar" — usado en las dos pantallas que enseñan un api_token una sola vez (alta y rotación, ver ConnectStoreForm y RotateStoreTokenButton). */
export function CopyableField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
        <code className="flex-1 break-all text-xs text-slate-700">{value}</code>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <Copy className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}
