// ─────────────────────────────────────────────────────────────────────────────
// Comprobación de Origin/Sec-Fetch-Site — cierra el bypass de CSRF vía
// formulario con enctype="text/plain" (evita el preflight CORS) en rutas
// JSON que confían en la cookie de sesión. Mismo principio que Next.js aplica
// automáticamente a las Server Actions (que este repo no usa para mutaciones,
// ver POST /api/stores y PATCH /api/products/[id]).
//
// Copiado tal cual de healzypp-clean/src/lib/security/origin-check.ts — ya
// validado ahí, ver audit-saas-security.md §4.2.
// ─────────────────────────────────────────────────────────────────────────────

import type { NextRequest } from 'next/server'

export function isTrustedOrigin(req: NextRequest): boolean {
  const secFetchSite = req.headers.get('sec-fetch-site')
  if (secFetchSite) {
    return secFetchSite === 'same-origin'
  }

  const origin = req.headers.get('origin')
  if (origin) {
    try {
      return new URL(origin).host === req.nextUrl.host
    } catch {
      return false
    }
  }

  // Sin Sec-Fetch-Site ni Origin: no es un fetch/form típico de navegador
  // moderno hacia este endpoint — se rechaza por precaución.
  return false
}
