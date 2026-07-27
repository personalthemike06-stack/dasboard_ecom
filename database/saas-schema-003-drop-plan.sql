-- ============================================================================
-- Healzyp Analytics SaaS — hito: plan único (14,99€/mes para todos), se
-- elimina la distinción básico/premium.
--
-- Va en la Supabase NUEVA del dashboard (la misma donde ya corriste
-- database/saas-schema.sql y saas-schema-002-expenses.sql) — NO en la de
-- ninguna tienda.
--
-- ESTE ARCHIVO NO SE EJECUTA SOLO. Revísalo tú mismo antes de pegarlo en el
-- SQL Editor de Supabase — es el que te pedí revisar antes de aplicar nada
-- de esquema.
--
-- QUÉ HACE: borra la columna clients.plan y el enum client_plan_enum. Ya no
-- hace falta: con un solo nivel de acceso, qué páginas ve un cliente depende
-- solo de clients.estado_suscripcion (ver dashboard/layout.tsx), no de un
-- plan. Mantener la columna sin usar solo generaría confusión futura (¿por
-- qué existe si nada la lee?), así que se quita en vez de dejarla de lado.
-- ============================================================================

ALTER TABLE clients DROP COLUMN IF EXISTS plan;

DROP TYPE IF EXISTS client_plan_enum;

-- ============================================================================
-- FIN — tras ejecutar esto, el código ya no debe seleccionar clients.plan en
-- ninguna consulta (ver src/lib/supabase/server.ts). Si tenías filas viejas
-- con plan = 'basico', no importa: la columna desaparece con ellas.
-- ============================================================================
