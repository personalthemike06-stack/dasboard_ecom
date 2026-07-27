// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting en memoria — ventana fija por clave, sin dependencias
// externas. healzypp-clean usa Upstash Redis (necesario ahí: múltiples
// endpoints de alto volumen, con SLA de abuso real en dinero/checkout). Aquí
// solo hace falta frenar POST /api/stores (crear tiendas, unas pocas veces
// por cliente en toda la vida de la cuenta en el caso normal) — añadir Redis
// solo para eso no compensa la infraestructura extra (nueva env var, nuevo
// servicio, nuevo punto de fallo). Ver audit-saas-security.md §5/Fase 2.
//
// Aviso: esto vive en memoria del proceso — en un despliegue serverless con
// varias instancias/regiones el límite es "por instancia caliente", no
// global exacto. Aceptable aquí porque ya no es la única defensa: el guard
// SSRF de src/lib/ssrf-guard.ts es quien de verdad bloquea el destino,
// independientemente de cuántas tiendas se intenten crear. Esto es fricción
// adicional contra automatización rápida, no la barrera principal. Si se
// despliega con múltiples instancias y hace falta un límite exacto, migrar
// a Upstash como ya hace healzypp-clean.
// ─────────────────────────────────────────────────────────────────────────────

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

// Poda perezosa (solo al comprobar, sin temporizador de fondo) para que el
// Map no crezca sin límite en un proceso de larga vida.
function prune(now: number) {
  if (buckets.size < 500) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number }

export function checkRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  prune(now)

  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    const bucket: Bucket = { count: 1, resetAt: now + windowMs }
    buckets.set(key, bucket)
    return { allowed: true, remaining: max - 1, resetAt: bucket.resetAt }
  }

  if (existing.count >= max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return { allowed: true, remaining: max - existing.count, resetAt: existing.resetAt }
}
