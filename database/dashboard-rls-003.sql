-- ============================================================================
-- Healzyp Analytics Dashboard — hito 3 (Contador: desglose por página +
-- visitantes históricos por día)
-- ============================================================================
--
-- ESTE ARCHIVO NO SE EJECUTA SOLO. Revísalo y ejecútalo tú mismo en el SQL
-- Editor de Supabase.
--
-- QUÉ NECESITA CADA PARTE:
--
-- 1. Desglose "en qué página está cada uno ahora" — NO necesita SQL nuevo.
--    tracking_page_views ya tiene RLS admin (hito del mapa) y ya existe
--    idx_tracking_page_views_session (database/tracking-schema.sql). Se
--    resuelve con dos SELECT normales + agregación en el cliente (mismo
--    patrón que ya usan useActiveSessions/useTopPages), sin volumen
--    suficiente en una ventana de 5 minutos como para necesitar nada más.
--
-- 2. Visitantes históricos por día — SÍ necesita esto: una función que
--    cuenta sesiones agrupadas por día en el propio Postgres.
--
--    Por qué no basta con traer las filas y contarlas en el cliente (como
--    hace el gráfico financiero con los gastos): Supabase/PostgREST devuelve
--    como mucho 1000 filas por consulta por defecto. Un rango de 30 días con
--    tráfico real podría superar eso fácilmente y el conteo saldría mal sin
--    ningún error visible. Agregar con GROUP BY dentro de Postgres evita el
--    problema por completo: la función devuelve como mucho un puñado de
--    filas (una por día), sin importar cuántas sesiones haya detrás.
--
--    "Visitantes" = sesiones únicas de tracking_sessions, no page views: una
--    persona que ve 5 páginas sigue siendo una visita, no cinco. Mismo
--    criterio que ya usa el contador en vivo (una fila de tracking_sessions
--    = una persona).
--
--    SECURITY INVOKER (el valor por defecto — no se especifica explícito):
--    la función se ejecuta con los permisos de quien la llama, así que sigue
--    respetando la política RLS admin_select_tracking_sessions ya existente.
--    Un usuario autenticado que no sea admin seguiría sin ver ninguna fila.
--
--    WHERE consent_given = true: verificado contra el código real de la
--    tienda (useSessionTracker.ts + tracking-client.ts + api/track/route.ts)
--    que hoy es imposible que exista una fila sin consentimiento — el hook
--    corta antes de construir la sesión si no hay consentimiento, así que
--    esta condición no filtra nada ahora mismo. Se deja puesta como red de
--    seguridad barata: si algún día ese hook cambia y deja de cortar ahí,
--    "visitantes" seguiría sin contar sesiones no consentidas sin que nadie
--    tenga que acordarse de tocar esta función.
-- ============================================================================

CREATE OR REPLACE FUNCTION dashboard_daily_visitors(p_since date, p_until date)
RETURNS TABLE(day date, visitors bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT
    date_trunc('day', created_at)::date AS day,
    COUNT(*)::bigint AS visitors
  FROM tracking_sessions
  WHERE created_at >= p_since::timestamptz
    AND created_at < (p_until::timestamptz + INTERVAL '1 day')
    AND consent_given = true
  GROUP BY 1
  ORDER BY 1;
$$;

GRANT EXECUTE ON FUNCTION dashboard_daily_visitors(date, date) TO authenticated;

-- ============================================================================
-- FIN — tras ejecutar esto, el bloque "Visitantes por día" del Contador
-- podrá llamar a supabase.rpc('dashboard_daily_visitors', { p_since, p_until }).
-- ============================================================================
