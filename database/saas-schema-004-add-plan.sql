-- ============================================================================
-- Healzyp Analytics SaaS — hito: vuelve el sistema de 3 planes (Básico/Pro/
-- Empresas) con límite de tiendas real, aplicado de verdad en POST
-- /api/stores. Revierte la decisión de saas-schema-003-drop-plan.sql:
-- /precios siempre prometió 3 planes con límites distintos y esa página
-- nunca se llegó a simplificar a plan único — el hallazgo de la auditoría
-- funcional fue justo ese desajuste. Esta vez el límite (5/15/ilimitado) no
-- vive solo en /precios: src/lib/plans.ts es la fuente única compartida
-- entre /precios, POST /api/stores y la UI del dashboard, para que no
-- vuelva a desincronizarse.
--
-- Va en la Supabase NUEVA del dashboard (la misma donde ya corriste
-- saas-schema.sql, saas-schema-002-expenses.sql y
-- saas-schema-003-drop-plan.sql) — NO en la de ninguna tienda.
--
-- ESTE ARCHIVO NO SE EJECUTA SOLO. Revísalo tú mismo antes de pegarlo en el
-- SQL Editor de Supabase.
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE client_plan_enum AS ENUM ('basico', 'pro', 'empresas');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- DEFAULT 'basico' rellena también las filas ya existentes al añadir la
-- columna (Postgres aplica el DEFAULT como backfill, no solo a filas
-- futuras) — ningún cliente actual se queda con plan NULL.
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS plan client_plan_enum NOT NULL DEFAULT 'basico';

COMMENT ON COLUMN clients.plan IS 'Determina el límite de tiendas conectadas (ver src/lib/plans.ts: básico 5, pro 15, empresas ilimitadas) y el precio mostrado en /dashboard/settings. Se actualizará por el webhook de Stripe (checkout.session.completed / customer.subscription.updated, hito 4, pendiente) — hasta entonces, para un cliente de prueba, se cambia a mano.';

-- ============================================================================
-- FIN.
--
-- Si quieres probar el límite de tiendas con un cliente de prueba en un
-- plan distinto de 'basico', ejecuta aparte (sustituyendo el id real):
--   UPDATE clients SET plan = 'pro' WHERE id = '<uuid-del-cliente>';
--
-- Tras ejecutar esto, src/lib/supabase/server.ts ya espera la columna
-- `plan` en su SELECT — si no la has aplicado todavía, cualquier página del
-- dashboard fallará al cargar el cliente. Confírmame cuando la hayas
-- ejecutado.
-- ============================================================================
