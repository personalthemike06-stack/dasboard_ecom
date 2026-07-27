-- ============================================================================
-- Cliente de prueba — vincula tu propio usuario de Supabase Auth (del
-- proyecto NUEVO, dedicado al SaaS) a una cuenta clients/client_users, para
-- poder probar selector de tienda + "Conectar tienda nueva" + bloqueo por
-- plan con una sesión real.
--
-- PASO 0 — fuera de SQL, hazlo primero si no lo has hecho ya:
--   Supabase Dashboard (proyecto NUEVO) → Authentication → Users →
--   "Add user" → crea tu usuario con email + contraseña, marcando
--   "Auto Confirm User" (si no, la cuenta queda sin confirmar y
--   signInWithPassword fallará). Usa esas mismas credenciales luego en
--   /login del dashboard.
--
-- ESTE ARCHIVO NO SE EJECUTA SOLO. Sustituye TU_EMAIL_AQUI (aparece dos
-- veces) por el email exacto de ese usuario antes de pegarlo en el SQL
-- Editor de Supabase — ahí se ejecuta como rol con privilegios, así que
-- bypasea RLS sin problema (no hace falta desactivarlo a mano).
-- ============================================================================

DO $$
DECLARE
  v_user_id   UUID;
  v_client_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'TU_EMAIL_AQUI';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No hay ningún usuario en auth.users con ese email. Créalo primero en Authentication → Users (Paso 0).';
  END IF;

  INSERT INTO clients (nombre, email_contacto, estado_suscripcion)
  VALUES ('Cliente de prueba', 'TU_EMAIL_AQUI', 'prueba')
  RETURNING id INTO v_client_id;

  INSERT INTO client_users (user_id, client_id)
  VALUES (v_user_id, v_client_id);

  RAISE NOTICE 'Listo — client_id: %, user_id: %', v_client_id, v_user_id;
END $$;

-- Para probar el bloqueo por suscripción (estado_suscripcion = 'cancelada' o
-- 'pago_fallido'), ejecuta esto aparte cuando quieras:
-- UPDATE clients SET estado_suscripcion = 'cancelada' WHERE email_contacto = 'TU_EMAIL_AQUI';

-- Este INSERT deja al cliente de prueba en plan 'basico' (el DEFAULT de la
-- columna) — con eso Contador/Mapa/Financiero deberían mostrar
-- UpgradeNotice en vez de la página real (ver planHasFullAccess() en
-- src/lib/plans.ts). Para probar el desbloqueo:
-- UPDATE clients SET plan = 'premium' WHERE email_contacto = 'TU_EMAIL_AQUI';

-- ============================================================================
-- FIN — inicia sesión en /login con el email/contraseña del Paso 0. Deberías
-- ver el header con "Cliente de prueba", el selector de tienda vacío con el
-- botón "Conectar tienda" (aún no hay ninguna), Pedidos y Productos
-- accesibles sin aviso, y Contador/Mapa/Financiero mostrando el aviso de
-- mejora de plan (plan 'basico' por defecto). Usa "Conectar tienda nueva"
-- con una URL y un token cualquiera (p.ej. https://healzyp.com y un texto de
-- prueba) — el INSERT no verifica que el endpoint responda de verdad, esa
-- llamada en vivo es el hito aparte que dejamos pendiente.
-- ============================================================================
