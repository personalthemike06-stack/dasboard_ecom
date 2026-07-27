-- ============================================================================
-- Healzyp Analytics SaaS — hito: mover dashboard_expenses a la Supabase del
-- dashboard, con store_id en vez de vivir en la Supabase de cada tienda.
--
-- Va en la Supabase NUEVA del dashboard (la misma donde ya corriste
-- database/saas-schema.sql) — NO en la de ninguna tienda.
--
-- ESTE ARCHIVO NO SE EJECUTA SOLO. Revísalo y ejecútalo tú mismo en el SQL
-- Editor de Supabase. Es un archivo NUEVO (saas-schema-002-...), no una
-- edición de saas-schema.sql, para no reeditar algo que ya ejecutaste —
-- mismo criterio que dashboard-rls-002.sql/003.sql en su momento.
--
-- POR QUÉ SE MUEVE: dashboard_expenses (definida hoy en
-- database/dashboard-rls-002.sql, contra la Supabase de la tienda de
-- Healzyp) es un concepto del DASHBOARD — gastos manuales que el cliente
-- lleva para ver beneficio, no algo de la tienda — así que no tiene sentido
-- que viva en la Supabase de cada tienda ni se pida por API. Encaja con
-- clients/stores/cached_metrics: cifras propias del SaaS, con RLS acotado
-- por cliente vía client_users, igual que el resto de este archivo.
--
-- store_id (no client_id): un cliente puede tener varias tiendas, y cada
-- una lleva sus propios gastos por separado (igual que cached_metrics) —
-- mismo criterio de granularidad que ya usa esa tabla.
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE dashboard_expense_category AS ENUM (
    'marketing',
    'herramientas',
    'envios',
    'otros'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS dashboard_expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  fecha           DATE NOT NULL,
  importe         DECIMAL(10, 2) NOT NULL CHECK (importe >= 0),
  categoria       dashboard_expense_category NOT NULL,
  descripcion     TEXT,
  fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE dashboard_expenses IS 'Gastos manuales por tienda, introducidos desde el dashboard — no forma parte del esquema de ninguna tienda, vive solo aquí.';

CREATE INDEX IF NOT EXISTS idx_dashboard_expenses_store_fecha ON dashboard_expenses(store_id, fecha DESC);

ALTER TABLE dashboard_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_select_own_dashboard_expenses" ON dashboard_expenses;
DROP POLICY IF EXISTS "client_insert_own_dashboard_expenses" ON dashboard_expenses;

-- Mismo patrón que client_select_own_cached_metrics en saas-schema.sql:
-- acceso vía stores → client_users, no un client_id directo en la tabla.
CREATE POLICY "client_select_own_dashboard_expenses" ON dashboard_expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores s
      JOIN client_users cu ON cu.client_id = s.client_id
      WHERE s.id = dashboard_expenses.store_id AND cu.user_id = auth.uid()
    )
  );

-- Solo alta y lectura, igual que en la versión anterior (dashboard-rls-002.sql):
-- no se pidió edición ni borrado de gastos.
CREATE POLICY "client_insert_own_dashboard_expenses" ON dashboard_expenses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores s
      JOIN client_users cu ON cu.client_id = s.client_id
      WHERE s.id = dashboard_expenses.store_id AND cu.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FIN — ver el mensaje de después de este bloque sobre la tabla vieja en la
-- Supabase de Healzyp (dashboard-rls-002.sql): no la borres todavía.
-- ============================================================================
