import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ─────────────────────────────────────────────────────────────────────────────
// Cliente de servidor — SOLO anon key (misma política que src/lib/supabase/client.ts).
// Se usa en Server Components / layouts para leer la sesión desde las cookies
// y decidir si el usuario autenticado es admin. No bypasea RLS: cualquier
// SELECT que haga con este cliente está sujeto a las políticas de Supabase.
// ─────────────────────────────────────────────────────────────────────────────
export async function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Faltan variables de entorno de Supabase: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Llamado desde un Server Component sin poder escribir cookies;
          // el middleware se encarga de refrescar la sesión en ese caso.
        }
      },
    },
  })
}

/** Mismo criterio de admin que el proyecto de la tienda: role='admin' en
 * app_metadata (solo se puede fijar server-side con la service_role key,
 * a diferencia de user_metadata que el propio usuario puede editar). */
export async function getCurrentAdminUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  if (user.app_metadata?.role !== 'admin') return null
  return user
}
