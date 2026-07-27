-- ============================================================================
-- Healzyp Analytics — esquema SaaS multi-cliente
-- Va en TU PROPIA Supabase (la del dashboard) — un proyecto DISTINTO al de
-- cada tienda. No confundir con database/dashboard-rls*.sql, que son
-- políticas sobre la Supabase de Healzyp (la tienda piloto): esos archivos
-- quedan obsoletos en cuanto este dashboard deje de leer datos de tienda por
-- RLS directo y pase a pedirlos por HTTP a /api/dashboard/stats (hito 1).
--
-- ESTE ARCHIVO NO SE EJECUTA SOLO. Revísalo y ejecútalo tú mismo en el SQL
-- Editor de Supabase.
--
-- ⚠️  CAMBIO DE INFRAESTRUCTURA, no solo de esquema: hoy este dashboard usa
-- la MISMA Supabase que la tienda de Healzyp (NEXT_PUBLIC_SUPABASE_URL en su
-- .env.local apunta ahí) para todo, incluido el login del único admin. Este
-- esquema asume un proyecto Supabase NUEVO y separado, dedicado solo al
-- dashboard — necesitarás crearlo y apuntar .env.local ahí antes de que nada
-- de esto sirva de algo. No lo he creado yo: es una decisión de
-- infraestructura tuya, coméntamelo cuando lo tengas listo.
--
-- QUÉ NO VA AQUÍ: nunca detalle de pedidos ni datos personales de clientes
-- finales (nombre/dirección/teléfono/email de comprador). Eso vive siempre
-- en la Supabase de cada tienda y se pide en vivo por API — ver
-- healzypp-clean/database/dashboard-api-schema.sql. Lo único que se cachea
-- aquí (cached_metrics, opcional) son cifras agregadas y anónimas.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. clients — cuentas del SaaS (una por cliente que paga la suscripción)
-- ────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE client_plan_enum AS ENUM ('basico', 'premium');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE client_subscription_status_enum AS ENUM ('activa', 'cancelada', 'pago_fallido', 'prueba');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS clients (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                   VARCHAR(255) NOT NULL,
  email_contacto           VARCHAR(255) NOT NULL,
  plan                     client_plan_enum NOT NULL DEFAULT 'basico',
  stripe_customer_id       VARCHAR(255) UNIQUE,
  stripe_subscription_id   VARCHAR(255) UNIQUE,
  estado_suscripcion       client_subscription_status_enum NOT NULL DEFAULT 'prueba',
  fecha_alta               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE clients IS 'Cuentas del SaaS — una por cliente que paga la suscripción mensual';
COMMENT ON COLUMN clients.plan IS 'Determina qué páginas ve el cliente (Pedidos/Productos/Financiero = premium). NO limita el número de tiendas conectadas: eso es ilimitado en cualquier plan (ver stores).';
COMMENT ON COLUMN clients.stripe_customer_id IS 'Rellenado al crear el Customer en Stripe — hito 4 (Stripe Subscriptions), pendiente de tu aprobación de diseño';
COMMENT ON COLUMN clients.stripe_subscription_id IS 'Rellenado al crear la Subscription en Stripe — hito 4, pendiente';
COMMENT ON COLUMN clients.estado_suscripcion IS 'Actualizado por el webhook customer.subscription.updated/deleted de Stripe (hito 4, pendiente) — no se toca a mano desde la UI';

CREATE INDEX IF NOT EXISTS idx_clients_estado_suscripcion ON clients(estado_suscripcion);


-- ────────────────────────────────────────────────────────────────────────────
-- 2. client_users — qué usuarios de Supabase Auth (de ESTE proyecto SaaS)
--    pertenecen a qué cliente. Separada de clients (en vez de un client_id
--    directo en auth.users) para poder añadir varios usuarios a la misma
--    cuenta más adelante sin cambiar el esquema — no se pidió esa función
--    ahora, pero la relación N:N no cuesta nada extra hoy.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS client_users (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  fecha_alta  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, client_id)
);

COMMENT ON TABLE client_users IS 'Vincula usuarios de Supabase Auth con su cliente. Se rellena en el flujo de alta (server-side, service_role) — un usuario autenticado nunca puede escribir aquí directamente, ver políticas RLS abajo.';

CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON client_users(client_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 3. stores — tiendas conectadas por cada cliente (varias por cliente,
--    ilimitadas en cualquier plan)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  nombre           VARCHAR(255) NOT NULL,
  url_tienda       TEXT NOT NULL,
  api_token        TEXT NOT NULL,
  activa           BOOLEAN NOT NULL DEFAULT true,
  fecha_conexion   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE stores IS 'Tiendas conectadas por un cliente. Cada tienda mantiene su propia Supabase — este dashboard NUNCA la guarda ni se conecta directamente a ella; solo pide datos en vivo a GET /api/dashboard/stats y /api/dashboard/orders/[id] de esa tienda usando api_token.';
COMMENT ON COLUMN stores.api_token IS 'Mismo valor que DASHBOARD_API_TOKEN en el .env de esa tienda (plantilla healzypp-clean) — se genera una vez al configurar la tienda y se pega aquí en "Conectar tienda nueva". Secreto del cliente propietario, nunca visible para otro cliente (ver RLS).';
COMMENT ON COLUMN stores.url_tienda IS 'Base URL de la tienda (p.ej. https://healzyp.com) — se le antepone /api/dashboard/stats al pedir datos.';
COMMENT ON COLUMN stores.activa IS 'Desactivar en vez de borrar conserva el histórico si algún día hay cached_metrics asociado.';

CREATE INDEX IF NOT EXISTS idx_stores_client_id ON stores(client_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_client_url ON stores(client_id, url_tienda);


-- ────────────────────────────────────────────────────────────────────────────
-- 4. cached_metrics — OPCIONAL, solo cifras agregadas y anónimas por tienda
--    y día, para acelerar históricos largos sin pedirlos en vivo cada vez.
--    NUNCA detalle de pedidos ni datos personales.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cached_metrics (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id              UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  fecha                 DATE NOT NULL,
  visitantes            INTEGER NOT NULL DEFAULT 0 CHECK (visitantes >= 0),
  pedidos               INTEGER NOT NULL DEFAULT 0 CHECK (pedidos >= 0),
  total_facturado       DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total_facturado >= 0),
  fecha_actualizacion   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, fecha)
);

COMMENT ON TABLE cached_metrics IS 'Cache opcional de históricos diarios por tienda — SOLO cifras agregadas y anónimas (visitantes/pedidos/facturación), nunca detalle de pedidos ni datos personales. Nunca es la fuente de verdad: se recalcula periódicamente pidiendo GET /api/dashboard/stats a cada tienda (UPSERT por store_id+fecha), y si esta tabla estuviera vacía o desactualizada, el dashboard sigue pudiendo pedir los datos en vivo.';

CREATE INDEX IF NOT EXISTS idx_cached_metrics_store_fecha ON cached_metrics(store_id, fecha DESC);


-- ════════════════════════════════════════════════════════════════════════════
-- 5. ROW LEVEL SECURITY — cada cliente ve SOLO sus propios datos
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_select_own" ON clients;
DROP POLICY IF EXISTS "client_users_select_own" ON client_users;
DROP POLICY IF EXISTS "client_select_own_stores" ON stores;
DROP POLICY IF EXISTS "client_insert_own_stores" ON stores;
DROP POLICY IF EXISTS "client_update_own_stores" ON stores;
DROP POLICY IF EXISTS "client_delete_own_stores" ON stores;
DROP POLICY IF EXISTS "client_select_own_cached_metrics" ON cached_metrics;

-- clients: cada cliente ve solo su propia cuenta. Sin políticas de
-- INSERT/UPDATE/DELETE para "authenticated" — crear la cuenta (alta), o
-- cambiar plan/estado_suscripcion (Stripe), son siempre operaciones de
-- servidor con service_role (que bypasea RLS), nunca algo que el cliente
-- haga directamente contra la tabla.
CREATE POLICY "client_select_own" ON clients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.client_id = clients.id AND cu.user_id = auth.uid()
    )
  );

-- client_users: cada usuario ve su propia fila (para resolver su client_id
-- tras iniciar sesión). Sin INSERT/UPDATE/DELETE: se rellena en el flujo de
-- alta server-side, no por el propio usuario.
CREATE POLICY "client_users_select_own" ON client_users
  FOR SELECT
  USING (user_id = auth.uid());

-- stores: el cliente gestiona sus propias tiendas de principio a fin —
-- necesario para "Conectar tienda nueva" (hito 3) y para poder desconectar
-- una tienda más adelante.
CREATE POLICY "client_select_own_stores" ON stores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.client_id = stores.client_id AND cu.user_id = auth.uid()
    )
  );

CREATE POLICY "client_insert_own_stores" ON stores
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.client_id = stores.client_id AND cu.user_id = auth.uid()
    )
  );

CREATE POLICY "client_update_own_stores" ON stores
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.client_id = stores.client_id AND cu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.client_id = stores.client_id AND cu.user_id = auth.uid()
    )
  );

CREATE POLICY "client_delete_own_stores" ON stores
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.client_id = stores.client_id AND cu.user_id = auth.uid()
    )
  );

-- cached_metrics: solo lectura de las tiendas propias. Nunca INSERT/UPDATE
-- para "authenticated" — lo escribe únicamente el job periódico que refresca
-- el cache, con service_role.
CREATE POLICY "client_select_own_cached_metrics" ON cached_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores s
      JOIN client_users cu ON cu.client_id = s.client_id
      WHERE s.id = cached_metrics.store_id AND cu.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FIN — pendiente de: (a) crear el proyecto Supabase nuevo y dedicado al
-- dashboard si aún no existe, (b) el flujo server-side que inserta en
-- clients/client_users al darse de alta un cliente (hito 3/4, aún no
-- construido), (c) el job periódico que rellena cached_metrics (opcional,
-- no bloquea nada de lo anterior).
-- ============================================================================
