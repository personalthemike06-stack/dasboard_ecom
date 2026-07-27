/**
 * Contenedor a pantalla completa compartido por /login y /registro — el
 * propio viewport es el contenedor (min-h-screen, sin card ni sombra
 * flotante). 50/50 en desktop (grid de 2 columnas, cada una estira a la
 * altura completa del viewport por comportamiento por defecto de grid). En
 * móvil, columna única: AuthBrandPanel se colapsa a una franja superior
 * compacta (ver order-first ahí) y el formulario ocupa el resto de la
 * altura visible. Sin 'use client' — no hay nada interactivo aquí, solo
 * layout; los formularios (LoginForm/RegisterForm) son los que necesitan
 * cliente.
 */
export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col md:grid md:grid-cols-2">{children}</div>
}
