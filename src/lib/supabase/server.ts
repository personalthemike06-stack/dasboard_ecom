import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { ClientPlan } from '@/lib/plans'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ─────────────────────────────────────────────────────────────────────────────
// Cliente de servidor — SOLO anon key (misma política que src/lib/supabase/client.ts).
// Se usa en Server Components / layouts para leer la sesión desde las cookies
// y resolver a qué cliente del SaaS pertenece. No bypasea RLS: cualquier
// SELECT que haga con este cliente está sujeto a las políticas de Supabase
// (database/saas-schema.sql en este proyecto).
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

export type CurrentClient = {
  id: string
  nombre: string
  email_contacto: string
  plan: ClientPlan
  estado_suscripcion: 'activa' | 'cancelada' | 'pago_fallido' | 'prueba'
  fecha_alta: string
  userEmail: string | null
}

type ClientRow = Omit<CurrentClient, 'userEmail'>

/**
 * Usuario de Supabase Auth de la sesión actual, o null si no hay sesión.
 * Separado de getCurrentClient() (que lo usa internamente) para que
 * dashboard/layout.tsx pueda distinguir "sin sesión" (→ redirect a /login)
 * de "con sesión pero sin cliente vinculado" (→ mensaje, NUNCA redirect:
 * como el middleware rebota /login → /dashboard para cualquier sesión
 * autenticada, redirigir aquí a /login crearía un bucle). cache() de React
 * hace que ambas llamadas (aquí y dentro de getCurrentClient) compartan la
 * misma consulta dentro del mismo render, no se duplica la llamada real.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) return null
  return user
})

/**
 * Cliente del SaaS al que pertenece el usuario autenticado (vía client_users
 * — ver database/saas-schema.sql), o null si no hay sesión o el usuario no
 * está vinculado a ningún cliente. Reemplaza al antiguo getCurrentAdminUser():
 * este dashboard ya no tiene un único admin, sino un cliente por cuenta.
 *
 * Envuelto en cache() de React: dashboard/layout.tsx y dashboard/settings
 * lo llaman cada uno por su cuenta — cache() deduplica la consulta real
 * dentro del mismo render en vez de repetirla.
 */
export const getCurrentClient = cache(async (): Promise<CurrentClient | null> => {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()

  // client_users_select_own (RLS) ya acota esto a la fila del propio
  // usuario — no hace falta filtrar por user_id "por si acaso", la política
  // ya lo garantiza.
  const { data, error: clientError } = await supabase
    .from('client_users')
    .select('client:clients(id, nombre, email_contacto, plan, estado_suscripcion, fecha_alta)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (clientError || !data?.client) return null

  const client = data.client as unknown as ClientRow
  return { ...client, userEmail: user.email ?? null }
})
