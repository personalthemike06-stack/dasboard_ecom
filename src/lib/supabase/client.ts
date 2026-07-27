import { createBrowserClient } from '@supabase/ssr'

// ─────────────────────────────────────────────────────────────────────────────
// Cliente de navegador — SOLO anon key, contra la Supabase DEDICADA a este
// dashboard SaaS (proyecto separado del de cada tienda — ver
// database/saas-schema.sql). Nunca debe importarse aquí una service_role
// key: escrituras como ProductActiveToggle o ConnectStoreForm dependen de
// que RLS decida qué puede tocar cada cliente, no de bypasearlo desde aquí.
// Si una consulta necesita más acceso del que da RLS, la solución es ajustar
// las políticas en Supabase, no añadir la clave maestra a este proyecto.
//
// La validación de las variables de entorno vive DENTRO de la función (no a
// nivel de módulo): así solo se dispara cuando de verdad se crea un cliente,
// en vez de reventar el `import` durante el build/SSR de páginas que todavía
// no lo han invocado.
// ─────────────────────────────────────────────────────────────────────────────
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Faltan variables de entorno de Supabase: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Copia .env.local.example como .env.local y rellena los valores del proyecto Supabase del dashboard SaaS.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
