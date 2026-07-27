// Mínimo y complejidad calcados EXACTAMENTE de la política de password del
// proyecto Supabase (Authentication → Providers → Email → Password
// Requirements) — confirmado a mano en el dashboard, no un valor por
// defecto asumido. Si esa política cambia en Supabase, hay que volver a
// mirarla ahí y actualizar esta lista a mano: no hay forma de leerla por
// API. Compartido entre RegisterForm (signUp) y ChangePasswordForm
// (updateUser) — ambos llaman a Auth con la misma política de contraseña,
// así que no tiene sentido validarla distinto en cada sitio.
export const PASSWORD_MIN_LENGTH = 7

export type PasswordRequirement = { label: string; met: boolean }

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { label: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`, met: password.length >= PASSWORD_MIN_LENGTH },
    { label: 'Una minúscula', met: /[a-z]/.test(password) },
    { label: 'Una mayúscula', met: /[A-Z]/.test(password) },
    { label: 'Un número', met: /[0-9]/.test(password) },
    { label: 'Un símbolo', met: /[^A-Za-z0-9]/.test(password) },
  ]
}
