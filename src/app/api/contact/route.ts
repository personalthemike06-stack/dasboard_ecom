// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contact — envía el formulario de /contacto por email vía Resend.
// Ruta de estado no autenticada (cualquier visitante público puede mandar
// un mensaje) — por eso el rate limit es por IP, no por cliente como en
// POST /api/stores (aquí no hay sesión de la que colgar la clave).
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { isTrustedOrigin } from '@/lib/security/origin-check'
import { checkRateLimit } from '@/lib/rate-limit'

const CONTACT_MAX = 5
const CONTACT_WINDOW_MS = 60 * 60 * 1000

const MOTIVO_LABELS = {
  producto: 'Dudas del producto',
  facturacion: 'Facturación',
  otro: 'Otro',
} as const

const contactSchema = z.object({
  nombre: z.string().trim().min(1, 'Cuéntanos tu nombre.').max(200),
  email: z.string().trim().email('Ese email no es válido.').max(320),
  motivo: z.enum(['producto', 'facturacion', 'otro'], {
    error: 'El motivo seleccionado no es válido.',
  }),
  mensaje: z.string().trim().min(1, 'Falta el mensaje.').max(5000),
})

// Sin req.ip (no garantizado fuera de Vercel) — x-forwarded-for es lo que
// pone el proxy/CDN delante de Next en cualquier despliegue estándar.
function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

// El mensaje y el nombre los escribe cualquier visitante anónimo — nunca
// interpolarlos en el HTML del email sin escapar.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 })
  }

  const rateLimit = checkRateLimit(`contact:${clientIp(req)}`, CONTACT_MAX, CONTACT_WINDOW_MS)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados mensajes en poco tiempo. Prueba de nuevo más tarde.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.max(0, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))) },
      }
    )
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Revisa los datos del formulario.' },
      { status: 400 }
    )
  }

  const { nombre, email, motivo, mensaje } = parsed.data

  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.CONTACT_TO_EMAIL
  const fromEmail = process.env.CONTACT_FROM_EMAIL

  if (!apiKey || !toEmail || !fromEmail) {
    console.error(
      '[contact] Faltan variables de entorno: RESEND_API_KEY / CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL'
    )
    return NextResponse.json(
      { error: 'El envío no está disponible ahora mismo. Escríbenos directamente por email.' },
      { status: 503 }
    )
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    replyTo: email,
    subject: `[Contacto] ${MOTIVO_LABELS[motivo]} — ${nombre}`,
    html: `
      <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Motivo:</strong> ${escapeHtml(MOTIVO_LABELS[motivo])}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${escapeHtml(mensaje).replace(/\n/g, '<br>')}</p>
    `.trim(),
  })

  if (error) {
    console.error('[contact] Resend error:', error)
    return NextResponse.json({ error: 'No se pudo enviar el mensaje. Inténtalo de nuevo.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
