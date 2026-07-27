-- ============================================================================
-- Healzyp Analytics SaaS — renombra los planes de pago sin tocar límites ni
-- precios: 'pro' -> 'premium', 'empresas' -> 'ultra'. 'basico' no cambia.
--
-- ALTER TYPE ... RENAME VALUE es la forma correcta para esto en Postgres:
-- relabela la etiqueta del enum in-place, sin tocar el OID interno del
-- valor. Todas las filas de clients.plan que ya son 'pro' pasan a leerse
-- 'premium' automáticamente — no hace falta ningún UPDATE, y no hay ventana
-- en la que una fila se quede con un valor inválido. Lo que SÍ rompería los
-- datos sería borrar el enum y crear uno nuevo con CREATE TYPE, o hacer
-- ADD VALUE + UPDATE + intentar quitar el valor viejo (los enums de
-- Postgres no permiten borrar un valor mientras siga en uso, y el intento
-- de rodeo con esa vieja receta de "renombrar tabla + recrear tipo" es
-- innecesario aquí porque RENAME VALUE existe desde Postgres 10).
--
-- Va en la misma Supabase donde ya corriste saas-schema.sql,
-- saas-schema-002-expenses.sql, saas-schema-003-drop-plan.sql y
-- saas-schema-004-add-plan.sql — NO en la de ninguna tienda.
--
-- ESTE ARCHIVO NO SE EJECUTA SOLO. Revísalo tú mismo antes de pegarlo en el
-- SQL Editor de Supabase.
-- ============================================================================

ALTER TYPE client_plan_enum RENAME VALUE 'pro' TO 'premium';
ALTER TYPE client_plan_enum RENAME VALUE 'empresas' TO 'ultra';

COMMENT ON COLUMN clients.plan IS 'Determina el límite de tiendas conectadas (ver src/lib/plans.ts: básico 5, premium 15, ultra ilimitadas) y qué páginas del dashboard puede ver el cliente (básico: solo Pedidos y Productos; premium/ultra: las 5). Precio mostrado en /dashboard/settings. Se actualizará por el webhook de Stripe (checkout.session.completed / customer.subscription.updated, hito 4, pendiente) — hasta entonces, para un cliente de prueba, se cambia a mano.';

-- ============================================================================
-- FIN.
--
-- Para un cliente de prueba que ya esté en 'pro' o 'empresas', no hace falta
-- ningún UPDATE aparte — el rename ya lo deja en 'premium'/'ultra'. Si
-- quieres cambiarle el plan a uno nuevo para probar el bloqueo de páginas:
--   UPDATE clients SET plan = 'basico' WHERE id = '<uuid-del-cliente>';
--   UPDATE clients SET plan = 'premium' WHERE id = '<uuid-del-cliente>';
--
-- Tras ejecutar esto, despliega el código que ya espera 'premium'/'ultra' en
-- src/lib/plans.ts — mientras el enum siga con 'pro'/'empresas' y el código
-- ya pida 'premium'/'ultra' (o al revés), cualquier cliente en ese plan
-- fallará al leer PLAN_INFO[client.plan]. Confírmame cuando la hayas
-- ejecutado.
-- ============================================================================
