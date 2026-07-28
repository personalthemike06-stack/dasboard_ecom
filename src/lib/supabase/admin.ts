import { createClient } from '@supabase/supabase-js'

// Cliente con service_role — SALTA RLS. Uso exclusivo del webhook de Stripe
// (src/app/api/webhooks/stripe/route.ts): es la única ruta que necesita
// escribir en clients/client_users sin que haya sesión de usuario de la que
// colgar una política RLS (esas tablas no dan INSERT/UPDATE a
// "authenticated" a propósito, ver database/saas-schema.sql). Nunca
// importar esto en código que corra en el navegador ni en ninguna otra
// ruta — a diferencia de src/lib/supabase/server.ts, este cliente no lee
// cookies: no representa a ningún usuario, solo al propio servidor.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
