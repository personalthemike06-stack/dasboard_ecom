import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refresca la sesión de Supabase en cada request (patrón estándar de
 * @supabase/ssr) y protege /dashboard: sin sesión, redirige a /login. Solo
 * anon key — igual que el resto del proyecto.
 *
 * Ya NO comprueba app_metadata.role === 'admin' (eso era el modelo de un
 * único admin de Healzyp). En el modelo SaaS multi-cliente, cualquier
 * usuario autenticado puede pasar de aquí; que además esté vinculado a un
 * cliente real (tabla client_users) lo comprueba getCurrentClient() en
 * dashboard/layout.tsx — el middleware no puede permitírselo por coste (una
 * consulta a Supabase en cada request de cada asset) y porque un check aquí
 * nunca sustituye al de un Server Component, solo lo complementa.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthenticated = user != null
  const path = request.nextUrl.pathname

  if (path.startsWith('/dashboard') && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (path === '/login' && isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
