import { createBrowserClient } from '@supabase/ssr'

// ─────────────────────────────────────────────────────────────────────────────
// Cliente de navegador — SOLO anon key.
// Este proyecto es de solo lectura contra la Supabase de producción de Healzyp:
// nunca debe importarse aquí una service_role key. Si una consulta necesita
// más acceso del que da RLS, la solución es ajustar las políticas RLS en
// Supabase (ver database/dashboard-rls.sql), no añadir la clave maestra.
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
        'Copia .env.local.example como .env.local y rellena los valores (misma Supabase que healzyp.com, solo anon key).'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
