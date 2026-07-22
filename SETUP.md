# Setup — Healzyp Analytics Dashboard

Proyecto independiente, de **solo lectura**, contra la misma Supabase de
producción de Healzyp. Nunca usa la `service_role key`; solo `anon key` +
políticas RLS explícitas para el rol admin.

## 1. Variables de entorno

```
cp .env.local.example .env.local
```

Rellena `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con los
mismos valores que usa el repo de la tienda (Supabase Dashboard → Project
Settings → API, o cópialos de `.env.local` en `healzypp-clean`). Son las
credenciales públicas de cliente — no la clave de servicio.

## 2. Cambios en Supabase (los ejecutas tú, no yo)

Este dashboard no puede leer nada todavía: la migración `002_enable_rls_tracking.sql`
del repo de la tienda bloquea toda lectura con anon key en las tablas
`tracking_*`. Hacen falta dos cosas, **en el SQL Editor de Supabase**:

1. Ejecuta `database/dashboard-rls.sql` — añade una política de SELECT para
   `tracking_sessions` solo cuando el JWT trae `app_metadata.role = 'admin'`,
   y añade la tabla a la publicación de Realtime. Revísalo antes de correrlo;
   está comentado explicando cada bloque.

2. Asegúrate de tener un usuario en Supabase Auth con `app_metadata.role =
   'admin'`:

   - **Si ya usas un admin en el panel de la tienda** (mismo criterio,
     `isCurrentUserAdmin()` en `src/lib/supabase-server.ts` del repo
     `healzypp-clean`), ese mismo email/contraseña sirve aquí tal cual —
     es la misma Supabase, el mismo `auth.users`. No hace falta nada más.
   - **Si no existe ninguno todavía**: crea el usuario desde el Dashboard de
     Supabase (Authentication → Users → Add user), y luego, en el SQL
     Editor, márcalo como admin:

     ```sql
     UPDATE auth.users
     SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
     WHERE email = 'tu-email-admin@healzyp.com';
     ```

     (`raw_app_meta_data` solo se puede editar server-side/SQL Editor —
     por eso no lo hace este proyecto, que solo tiene la anon key.)

No voy a ejecutar ni el SQL ni el alta de usuario yo mismo: son cambios en tu
base de producción y me pediste confirmación explícita antes de tocarla.

## 3. Arrancar en local

```
npm install
npm run dev
```

`http://localhost:3000` redirige a `/dashboard`, que a su vez redirige a
`/login` si no hay sesión admin. Tras iniciar sesión con la cuenta admin
(paso 2), deberías ver el contador de usuarios activos en los últimos 5
minutos, actualizándose solo via Supabase Realtime.

## Roadmap (según lo pedido)

1. ✅ Login de admin + contador de usuarios activos en tiempo real — este hito.
2. Mapa/globo de sesiones activas por país/ciudad (Supabase Realtime).
3. Panel de productos más vistos + funnel de conversión del día.

Cada hito nuevo puede necesitar su propia política RLS de solo-lectura
(mismo patrón que `database/dashboard-rls.sql`) sobre `tracking_page_views`,
`tracking_product_views`, `tracking_cart_actions`, `tracking_conversions`.
