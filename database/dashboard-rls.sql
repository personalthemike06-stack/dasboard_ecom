-- ============================================================================
-- Healzyp Analytics Dashboard — permisos de solo lectura en Supabase
-- ============================================================================
--
-- ESTE ARCHIVO NO SE EJECUTA SOLO. Es una propuesta de cambios de esquema
-- en la Supabase de PRODUCCIÓN de Healzyp — revísalo y ejecútalo tú mismo
-- en el SQL Editor de Supabase cuando estés de acuerdo con lo que hace.
-- Ningún proceso de este proyecto nuevo tiene permiso ni credenciales para
-- aplicarlo automáticamente (solo usa la anon key, nunca la service_role).
--
-- CONTEXTO:
--   database/migrations/002_enable_rls_tracking.sql (repo de la tienda)
--   habilitó RLS en todas las tablas tracking_* con una política
--   "block_anon_select" (USING (false)) que bloquea CUALQUIER lectura con
--   la anon key. Eso es correcto para el sitio público, pero significa que,
--   tal y como está hoy, este dashboard (que solo tiene la anon key) no
--   puede leer nada todavía.
--
--   Este script añade una política adicional que permite SELECT solo a
--   usuarios autenticados cuyo JWT tenga app_metadata.role = 'admin'
--   (el mismo criterio que ya usa isCurrentUserAdmin() en el repo de la
--   tienda — src/lib/supabase-server.ts). Un usuario normal de la tienda,
--   autenticado o no, sigue sin poder leer estas tablas: solo la cuenta
--   admin puede.
--
-- ALCANCE DE ESTE PRIMER HITO: solo tracking_sessions (contador de activos).
-- Cuando avancemos al mapa, top productos y funnel, harán falta políticas
-- equivalentes en tracking_page_views, tracking_product_views,
-- tracking_cart_actions, tracking_conversions — se añaden aquí mismo más
-- adelante, no hace falta tocar nada de la tienda.
-- ============================================================================

-- ─── 1. Permitir lectura a admin en tracking_sessions ───────────────────────

CREATE POLICY "admin_select_tracking_sessions" ON tracking_sessions
  FOR SELECT
  USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );

-- ─── 2. Habilitar Realtime en tracking_sessions ─────────────────────────────
-- Necesario para que el contador en vivo reaccione a INSERT/UPDATE sin
-- recargar. No afecta a nada del sitio de la tienda: Realtime solo emite
-- eventos a quien esté suscrito (este dashboard).

ALTER PUBLICATION supabase_realtime ADD TABLE tracking_sessions;

-- ============================================================================
-- FIN — tracking_sessions únicamente. Ver SETUP.md para el resto de pasos
-- (crear/marcar el usuario admin) antes de que el login funcione.
-- ============================================================================
