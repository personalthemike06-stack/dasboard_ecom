-- ============================================================================
-- Healzyp Analytics Dashboard — hito 2 (mapa, pedidos, productos, financiero)
-- REEMPLAZA la versión anterior de este archivo.
--
-- QUÉ PASÓ: la versión anterior se escribió contra un schema de la tienda que
-- NO es el real — nombres en inglés inventados (order_number, paid_at,
-- active, tabla categories...). La tienda real usa numero_pedido,
-- fecha_actualizacion, activo, y no tiene tabla categories (products.categoria
-- es un texto libre). Verificado esta vez contra supabase/schema.sql +
-- supabase/migrations/000{1,2,3}_*.sql del repo de la tienda (healzypp-clean),
-- que es el schema realmente desplegado en producción — no contra
-- database/complete-schema.sql, que resultó ser una versión antigua/no
-- desplegada con nombres en inglés.
--
-- Esa versión anterior incluía `GRANT UPDATE (active) ON products`, y
-- "active" no existe como columna (es "activo"). Si la ejecutaste tal cual
-- en el SQL Editor de Supabase, esa línea rompe el script, y como Supabase
-- ejecuta el script pegado como una única transacción implícita, TODO lo de
-- ese archivo se revirtió — incluida la tabla dashboard_expenses. Este
-- archivo se puede pegar y ejecutar entero sin mirar qué quedó a medias:
-- todo es idempotente (CREATE ... IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- ESTE ARCHIVO NO SE EJECUTA SOLO. Revísalo y ejecútalo tú mismo en el SQL
-- Editor de Supabase.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. orders / order_items / products / bundles — SIN CAMBIOS, y es intencional
--
-- El schema real de la tienda YA tiene políticas RLS basadas en is_admin()
-- (supabase/schema.sql, sección 8) que dan acceso total a estas tablas a
-- cualquier JWT con app_metadata.role = 'admin' — el mismo criterio que ya
-- usa este dashboard:
--
--   orders_select_own:      FOR SELECT USING (auth.uid() = user_id OR is_admin())
--   order_items_select_own: FOR SELECT USING (EXISTS (... OR is_admin()))
--   products_select_public: FOR SELECT USING (activo = true OR is_admin())
--   products_update_admin:  FOR UPDATE USING (is_admin())  ← sin restricción
--                            de columna: el admin ya puede actualizar
--                            cualquier campo, incluido "activo" para el
--                            toggle de Productos. No hace falta ningún GRANT
--                            adicional.
--
-- bundles no tiene RLS habilitado en absoluto en supabase/schema.sql (no
-- aparece en la lista de ALTER TABLE ... ENABLE ROW LEVEL SECURITY), así que
-- ya es legible sin restricciones. El propio schema real lo marca como "ya
-- existe en producción" — no toco RLS de bundles aquí; sería un cambio de la
-- tienda, no de este dashboard.
--
-- Los 4 errores que viste (order_number, paid_at, products↔categories,
-- products_1.title) eran de nombres de columna equivocados en el código del
-- dashboard, no de permisos. El fix real está en el código de las páginas
-- (ya corregido en este mismo cambio). Limpio abajo cualquier resto de la
-- política/policy vieja por si alguna llegó a aplicarse suelta.
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_select_products" ON products;
DROP POLICY IF EXISTS "admin_select_bundles" ON bundles;
DROP POLICY IF EXISTS "admin_update_products_active" ON products;
DROP POLICY IF EXISTS "admin_select_orders" ON orders;
DROP POLICY IF EXISTS "admin_select_order_items" ON order_items;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. Mapa — tracking_page_views (panel "top páginas ahora" junto al mapa)
--    Tabla del sistema de tracking (inglés, database/tracking-schema.sql),
--    independiente del rename a español de orders/products — no le afecta
--    nada de lo anterior. Sigue haciendo falta esta política (mismo patrón
--    que tracking_sessions en database/dashboard-rls.sql, hito 1, ya
--    aplicada). Re-ejecutar esto es seguro aunque ya la hubieras creado.
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_select_tracking_page_views" ON tracking_page_views;

CREATE POLICY "admin_select_tracking_page_views" ON tracking_page_views
  FOR SELECT
  USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );


-- ────────────────────────────────────────────────────────────────────────────
-- 3. Página Financiera — tabla nueva dashboard_expenses
--    No existe en el esquema de la tienda: es una tabla nueva, propia de este
--    dashboard, para llevar los gastos manuales. Sin relación con el rename a
--    español — es de este proyecto, no de la tienda.
-- ────────────────────────────────────────────────────────────────────────────

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
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha         DATE NOT NULL,
  importe       DECIMAL(10, 2) NOT NULL CHECK (importe >= 0),
  categoria     dashboard_expense_category NOT NULL,
  descripcion   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE dashboard_expenses IS 'Gastos manuales introducidos desde Healzyp Analytics Dashboard (no forma parte del esquema de la tienda)';

CREATE INDEX IF NOT EXISTS idx_dashboard_expenses_fecha ON dashboard_expenses(fecha DESC);

ALTER TABLE dashboard_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_dashboard_expenses" ON dashboard_expenses;
DROP POLICY IF EXISTS "admin_insert_dashboard_expenses" ON dashboard_expenses;

-- Solo admin puede leer y crear gastos. Sin UPDATE/DELETE por ahora: no se
-- pidió edición ni borrado, solo alta y lectura para el gráfico.
CREATE POLICY "admin_select_dashboard_expenses" ON dashboard_expenses
  FOR SELECT
  USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );

CREATE POLICY "admin_insert_dashboard_expenses" ON dashboard_expenses
  FOR INSERT
  WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );

-- ============================================================================
-- FIN — tras ejecutar esto, solo falta el fix de código (ya aplicado) para
-- que mapa, pedidos, productos y financiero funcionen con los nombres reales
-- de columna.
-- ============================================================================
