# Auditoría de seguridad — Healzyp Analytics SaaS

Fecha: 2026-07-25.
Alcance: `healzyp-analytics` (dashboard SaaS multi-cliente) completo + la superficie `/api/dashboard/*` de `healzypp-clean` que ese dashboard consume (autenticación por token, rate limiting, RLS de las tablas que tocan esos endpoints). El resto de `healzypp-clean` (checkout, pagos, SEO, accesibilidad…) ya tiene su propia auditoría en `docs/audit-full.md`/`audit-full-v2.md` y no se repite aquí salvo que sea relevante para la integración con el SaaS.
Metodología: revisión de código estática (lectura completa de cada ruta/lib relevante + grep dirigido), `npm audit` real en ambos repos. **No se ha modificado ningún archivo** — este documento es puramente diagnóstico.

---

## Resumen ejecutivo

Ordenado por severidad. El diseño de fondo es sólido (RLS bien planteada, tokens con `crypto.randomBytes(32)`, comparación en tiempo constante, rate limiting en el lado de la tienda, cero uso de `service_role` en el dashboard) — el hallazgo crítico es puntual y aislado (un solo endpoint) pero de impacto alto.

| # | Hallazgo | Área | Severidad |
|---|---|---|---|
| 1 | **SSRF confirmado y explotable**: `POST /api/stores` acepta cualquier `url_tienda` y el servidor le hace `fetch()` sin validar el host, de forma recurrente (cada carga de página + cada refresco automático de 20s) — un cliente autenticado puede apuntar su propia "tienda" a `169.254.169.254`, `127.0.0.1`, rangos privados o cualquier host interno | SSRF | **Crítico** |
| 2 | `url_tienda` admite `http://` sin restricción — el `Authorization: Bearer <api_token>` viajaría en claro si alguien conecta una tienda por HTTP | Tokens / SSRF | **Alto** |
| 3 | La respuesta de la tienda no tiene límite de tamaño antes de `res.json()` — una tienda (o el destino de un SSRF) que devuelva un cuerpo enorme puede agotar memoria del proceso, en cada ciclo de refresco | SSRF / DoS | **Medio-Alto** |
| 4 | Sin flujo de rotación/regeneración de `api_token` — si se filtra, no hay forma de invalidarlo sin editar la fila a mano en Supabase y volver a desplegar la tienda | Tokens | **Medio** |
| 5 | Rutas de estado (`POST /api/stores`, `PATCH /api/products/[id]`) sin comprobación explícita de `Origin`/`Sec-Fetch-Site` — el mismo patrón que ya se corrigió en la tienda (`lib/security/origin-check.ts`) no se replicó aquí. Mitigado hoy por `SameSite=Lax` de `@supabase/ssr`, pero es una suposición implícita, no un control propio | CSRF | **Medio** |
| 6 | Cero rate limiting en todo `healzyp-analytics` — en particular `POST /api/stores` (el mismo endpoint del SSRF) no tiene límite, así que un atacante puede crear tiendas apuntando a muchos hosts/puertos internos a la velocidad que quiera | Rate limiting / DoS | **Medio** |
| 7 | `GET /api/dashboard/orders` (lista) es el único endpoint `dashboard/*` sin `MAX_RANGE_DAYS` — `stats` y `finance-series` sí lo aplican | Rate limiting / DoS | **Bajo** |
| 8 | `dashboard_daily_visitors` sigue con `GRANT EXECUTE ... TO authenticated` en la Supabase de la tienda — resto de un pathway (panel admin con acceso directo) que ya no existe en el código actual; cualquier cliente logueado de la tienda puede leer hoy visitantes agregados por día vía PostgREST | RLS / privilegio mínimo | **Bajo** |
| 9 | 3 vulnerabilidades `npm audit` (alta) en `healzyp-analytics`, 5 en `healzypp-clean` — todas en dependencias transitivas de `next`/`sharp`/`postcss` | Dependencias | **Alto (por CVSS), bajo riesgo real hoy** |

**Verificado sin hallazgo** (comprobado activamente, no asumido): RLS de `clients/client_users/stores/cached_metrics/dashboard_expenses` aísla correctamente por cliente incluso manipulando IDs a mano; el dashboard nunca usa `service_role`; comparación de token en tiempo constante ya implementada; `MAX_RANGE_DAYS` sí aplicado en `stats`/`finance-series`; IDs de pedido/producto validados por regex UUID antes de interpolarse en cualquier URL o query; ningún dato de la tienda se renderiza con `dangerouslySetInnerHTML` en el dashboard — el único punto que inyecta HTML crudo (`WorldMap.tsx`, tooltip del globo) escapa explícitamente `<`/`>`/`&`/`"` antes de interpolar; no hay flujo de alta pública, así que no hay vector de auto-vincularse a `client_id` ajeno todavía; no hay secretos en el repo.

---

## 1. SSRF (Server-Side Request Forgery) — riesgo crítico

### 1.1 Confirmado explotable

**`POST /api/stores`** (`src/app/api/stores/route.ts:51-63`) solo valida que `url_tienda` sea una URL bien formada con esquema `http:` o `https:`:

```ts
let urlTienda: URL
try {
  urlTienda = new URL(urlTiendaRaw)
} catch { ... }

if (urlTienda.protocol !== 'https:' && urlTienda.protocol !== 'http:') { ... }
```

No hay ninguna comprobación de host: nada impide `http://169.254.169.254/`, `http://127.0.0.1:6379`, `http://10.0.0.5`, `http://192.168.1.1`, `http://[::1]`, ni variantes de IP ofuscada (`http://0x7f000001/`, `http://2130706433/`). Ese valor se guarda tal cual en `stores.url_tienda` y **cada** llamada posterior a `getStoreStats`/`getFinanceSeries`/`getOrders`/`getOrderDetail`/`getProducts`/`updateProductActive` (`src/lib/store-api.ts:14-67`, función `fetchStoreApi`) hace:

```ts
url = new URL(path, store.url_tienda)   // sin validar el host resuelto
...
const res = await fetch(url, { method, headers: { Authorization: `Bearer ${store.api_token}` }, ... })
```

Como esto se dispara desde `getStoreStats()` en **cada render** de `/dashboard` y `/dashboard/map`, y además cada una de esas páginas monta `<AutoRefresh intervalMs={20000}>` (`src/components/AutoRefresh.tsx`), que llama a `router.refresh()` cada 20s, el servidor de `healzyp-analytics` queda haciendo peticiones HTTP recurrentes y automáticas a cualquier host que un cliente autenticado decida, sin que nadie tenga que volver a interactuar.

### 1.2 Qué puede hacer un atacante con esto

- **Un cliente legítimo del SaaS** (no hace falta "controlar un servidor malicioso": basta con escribir la URL en el propio formulario "Conectar tienda nueva") puede poner `http://169.254.169.254` como `url_tienda`. El servidor intentará `GET http://169.254.169.254/api/dashboard/stats` cada vez que ese cliente cargue su dashboard o cada 20s mientras lo tenga abierto. Si `healzyp-analytics` corre sobre una VM/contenedor en AWS/GCP/Azure con el servicio de metadatos accesible, esto es el vector clásico de robo de credenciales del rol de instancia — aunque en este caso el `path` que se pide está fijado por función (`/api/dashboard/stats`, `/api/dashboard/orders`, etc., siempre con `/` inicial, lo que en `new URL(path, base)` **descarta** cualquier path que llevara `url_tienda` y resuelve contra el *origin*), así que no se puede pedir directamente `/latest/meta-data/iam/security-credentials/<rol>` con este mecanismo tal cual — pero sí basta para: escanear si el servicio de metadatos u otro host interno está vivo (oráculo de estado/tiempo/respuesta), y si esa ruta fija (`/api/dashboard/stats`) devuelve JSON en el destino interno, el cuerpo se parsea con `as T` sin validar el esquema (`store-api.ts:55`) y los campos que coincidan por nombre se renderizarían tal cual en el dashboard.
- **Escaneo de red interna**: registrando varias tiendas con distintas combinaciones `http://10.0.0.X:PUERTO`, el atacante distingue "conexión rechazada" (`No se pudo conectar con la tienda`) de "tardó demasiado" (`AbortError`, timeout de 8s) de "respondió con error N" (`store-api.ts:45-53`) — suficiente para huella de servicios internos puerto a puerto, con el propio servidor del SaaS como origen de los paquetes.
- **El servidor como proxy ciego**: cualquier URL pública también sirve como "usar la IP del SaaS para pegarle a un tercero" — el request lleva un `Authorization: Bearer <token propio del atacante>`, así que no filtra credenciales ajenas, pero sí permite generar tráfico HTTP recurrente con la reputación/IP de tu infraestructura contra terceros (rate-limit bypass, ocultar el origen real).
- El `fetch()` de Node **sigue redirecciones por defecto** (`fetchStoreApi` no pasa `redirect: 'manual'`). Aunque se añada una validación de host en el *connect-time* (al hacer `POST /api/stores`), un host público válido puede responder `302` hacia `http://169.254.169.254/...` en el momento del *fetch real* y el store-api lo seguiría igualmente (bypass clásico de allowlist + DNS rebinding: el DNS del host puede resolver a una IP pública al validar y a una privada segundos después, en el propio `fetch()`).

### 1.3 Recomendaciones (por orden de importancia)

1. **Validar en el momento del fetch, no solo al conectar.** Cualquier chequeo hecho solo en `POST /api/stores` es vulnerable a DNS rebinding. La validación real tiene que ocurrir dentro de `fetchStoreApi()`, justo antes de cada `fetch()`.
2. **Resolver el DNS explícitamente y bloquear rangos no enrutables/privados** antes de conectar: loopback (`127.0.0.0/8`, `::1`), link-local incluida la de metadatos cloud (`169.254.0.0/16`, `fe80::/10` — cubre `169.254.169.254`), RFC1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), `0.0.0.0/8`, CGNAT (`100.64.0.0/10`), y direcciones IPv4 mapeadas en IPv6 (`::ffff:127.0.0.1`). Aplica tanto al conectar como, otra vez, antes de cada fetch real.
3. **Desactivar redirecciones automáticas** (`redirect: 'manual'` en el `fetch()` de `fetchStoreApi`) y, si se quiere soportar un salto, revalidar el destino del `Location` contra el mismo filtro antes de seguirlo manualmente.
4. **Forzar `https:` únicamente en producción** (ver también hallazgo #2) — reduce la superficie a servicios que hablan TLS, lo que ya excluye buena parte de servicios internos "accidentalmente" expuestos.
5. **Limitar el tamaño de la respuesta** (ver hallazgo #3) — no leer `res.json()` sin límite.
6. **Confirmar que el timeout se respeta**: sí — `TIMEOUT_MS = 8000` con `AbortController` (`store-api.ts:12,30-31,64-66`) está bien implementado y cubre tanto el intento de conexión como la espera de respuesta.
7. Opcional pero recomendable: no propagar el mensaje de error crudo del `fetch` al cliente (`No se pudo conectar con la tienda. Verifica la URL y el token.` ya es genérico, bien) — evitar añadir en el futuro detalles de red (código de error de socket, IP resuelta) que ayuden a afinar el escaneo.

---

## 2. Tokens de API (`DASHBOARD_API_TOKEN` / `stores.api_token`)

| Severidad | Hallazgo | Archivo:línea | Recomendación |
|---|---|---|---|
| **Alto** | `url_tienda` admite `http://` — si un cliente conecta su tienda por HTTP (o un atacante se la "conecta" a un endpoint que él controla en HTTP), el token viaja sin cifrar en cada request de refresco | `src/app/api/stores/route.ts:61-63` | Restringir a `https:` en producción (permitir `http://localhost`/`127.0.0.1` solo si hay un modo desarrollo explícito, nunca en el flujo normal de un cliente real). |
| Medio | Sin rotación de token — `POST /api/stores` es la única ruta de escritura sobre `stores` (`src/app/api/stores/route.ts`); no existe `PATCH`/`DELETE` ni en `src/lib/stores.ts` ningún helper de regenerar. Si el token se filtra (captura de pantalla, soporte, laptop comprometido), la única vía es editar `stores.api_token` a mano en Supabase **y** volver a desplegar `DASHBOARD_API_TOKEN` en la tienda — sin ningún flujo guiado | `src/app/api/stores/route.ts`, `src/lib/stores.ts` | Añadir `PATCH /api/stores/:id/rotate` (genera nuevo `api_token` con `randomBytes(32)`, lo devuelve una vez como ya hace el alta) y una UI en Configuración para dispararlo, coherente con la sección "Tiendas conectadas" que ya existe en `dashboard/settings/page.tsx:117-137` (hoy solo lectura). |
| — (verificado) | Entropía/longitud del token | `src/app/api/stores/route.ts:67` | `randomBytes(32).toString('base64url')` se mantiene — 256 bits, correcto. El lado de la tienda usa `randomBytes(32).toString('hex')` (comentario en `healzypp-clean/src/lib/dashboard-api-auth.ts:8`) — incompatible en formato de generación pero equivalente en entropía; no es un problema real porque el token nunca se autogenera por ese comando en producción, lo genera siempre `POST /api/stores` y el cliente lo pega tal cual en el `.env` de la tienda. |
| — (verificado) | Comparación en tiempo constante | `healzypp-clean/src/lib/dashboard-api-auth.ts:21-29` | `timingSafeEqual` ya implementado correctamente, incluyendo el caso de longitudes distintas (compara contra sí mismo para no filtrar tiempo por longitud). Sin cambios necesarios. |
| — (verificado) | Exposición en logs/errores | `src/lib/store-api.ts:56-66`, `healzypp-clean/src/app/api/dashboard/*/route.ts` (`console.error('[...] error:', err)`) | Los `catch` solo loguean el objeto de error de Supabase/fetch, nunca el token ni la `Authorization` header. El token tampoco aparece en ninguna respuesta JSON salvo la única vez que se genera (`POST /api/stores`, con aviso explícito en la UI de "no podrás volver a verlo completo" — `ConnectStoreForm.tsx:111-116`). Sin hallazgo. |
| — (contexto) | `stores.activa` existe en el esquema ("desactivar en vez de borrar") pero ningún endpoint la modifica todavía — ni desconectar ni reactivar una tienda es posible desde la UI hoy | `database/saas-schema.sql` (columna `activa`) | No es un hallazgo de seguridad en sí, pero conviene resolverlo junto con la rotación de token (arriba): "sospecho que se filtró" hoy no tiene ninguna acción disponible en producto, ni rotar ni desconectar. |

**Nota de diseño importante**: como `/api/dashboard/*` en `healzypp-clean` se sirve con `service_role` (bypasea RLS por completo — ver `healzypp-clean/src/lib/supabase.ts:27-44`), **el `api_token` es el único control de acceso real** sobre los datos de esa tienda vía esta vía. RLS no aporta ninguna capa adicional aquí. Esto hace que los tres puntos de arriba (HTTPS obligatorio, rotación, no-exposición) sean más críticos de lo que su severidad individual sugiere — son la única línea de defensa.

---

## 3. Row Level Security — ambos proyectos Supabase

### 3.1 `healzyp-analytics` (Supabase dedicada al SaaS) — `database/saas-schema.sql`

Revisadas las 4 tablas con RLS habilitada: `clients`, `client_users`, `stores`, `cached_metrics`, más `dashboard_expenses` (`database/saas-schema-002-expenses.sql`).

| Tabla | Política | Verificación |
|---|---|---|
| `clients` | `client_select_own`: `EXISTS (... client_users cu WHERE cu.client_id = clients.id AND cu.user_id = auth.uid())` | Un cliente solo ve su propia fila; sin `INSERT`/`UPDATE`/`DELETE` para `authenticated` (alta y cambios de plan son siempre `service_role`, hoy ni siquiera implementados). Correcto. |
| `client_users` | `client_users_select_own`: `user_id = auth.uid()` | Sin escritura para el usuario. Correcto — el alta la hace un script manual (`seed-test-client.sql`) hoy. |
| `stores` | `client_select/insert/update/delete_own_stores`, las 4 con el mismo `EXISTS (... client_users cu WHERE cu.client_id = stores.client_id AND cu.user_id = auth.uid())` | **Probado el caso límite**: `POST /api/stores` (`src/app/api/stores/route.ts:73`) pone `client_id: client.id` donde `client.id` viene de `getCurrentClient()` — nunca del body — así que aunque alguien manipule el `client_id` no hay ningún input de cliente que lo determine. Y aunque lo hubiera, `client_insert_own_stores` lo rechazaría igual (comentario explícito en el propio código, línea 12-16, confirmado correcto). Manipular el `id` de una tienda ajena en la URL/cookie tampoco filtra nada: `getSelectedStore()` (`src/lib/stores.ts:86-94`) primero trae `getClientStores()` (ya acotado por RLS a las tiendas propias) y solo hace *match* dentro de ese conjunto — una cookie con el UUID de la tienda de otro cliente simplemente no encuentra coincidencia y cae al fallback (la primera tienda propia). Verificado correcto. |
| `cached_metrics` | Solo `SELECT`, vía `stores s JOIN client_users cu` | Tabla no usada activamente todavía (cache opcional, sin job que la rellene), pero la política en sí es correcta. |
| `dashboard_expenses` | `SELECT`/`INSERT` vía `stores s JOIN client_users cu ON cu.client_id = s.client_id WHERE s.id = dashboard_expenses.store_id` | Un cliente no puede insertar un gasto con el `store_id` de otro cliente — lo bloquea el `WITH CHECK` del `INSERT`, no solo la UI. Verificado correcto (defensa en profundidad real, no solo confiar en que `NewExpenseForm.tsx` mande el `store_id` correcto). |

**Confirmado**: ningún cliente puede ver ni modificar datos de otro manipulando IDs a mano, en las 5 tablas.

### 3.2 `healzypp-clean` (Supabase de cada tienda) — tablas que tocan `/api/dashboard/*`

Estos endpoints usan `createServiceClient()` (`service_role`) para **todo** — `orders`, `order_items`, `products`, `bundles`, `tracking_*` — lo que **bypasea RLS por diseño**. La seguridad de estos 6 endpoints depende 100% de `authenticateDashboardRequest()` (el token), no de las políticas RLS de esas tablas. Confirmado que ningún endpoint de `dashboard/*` usa la `anon key` donde debería usar `service_role` ni al revés — los 6 (`stats`, `orders`, `orders/[id]`, `products`, `products/[id]`, `finance-series`) usan `createServiceClient()` de forma consistente.

| Severidad | Hallazgo | Archivo:línea | Recomendación |
|---|---|---|---|
| **Bajo** | `GRANT EXECUTE ON FUNCTION dashboard_daily_visitors(date, date) TO service_role, authenticated` — el `authenticated` es un resto explícito de una arquitectura anterior ("panel de admin (healzyp-analytics)" que llamaba a esta función con el JWT del admin, directo contra la Supabase de la tienda). Esa arquitectura ya no existe: confirmado por grep que `healzyp-analytics` no tiene ningún cliente de Supabase apuntando a un proyecto que no sea el suyo propio dedicado (`src/lib/supabase/*`, siempre `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` del proyecto del SaaS), y los hooks antiguos (`useActiveSessions`, `usePagesNow`, `useTopPages`) ya están borrados. El efecto práctico: **cualquier usuario logueado de la propia tienda** (un comprador normal con cuenta) puede llamar `rpc/dashboard_daily_visitors` vía PostgREST directamente y leer visitantes agregados por día de todo el sitio | `healzypp-clean/database/dashboard-api-schema.sql:52` | `REVOKE EXECUTE ON FUNCTION dashboard_daily_visitors(date, date) FROM authenticated;` — solo `service_role` la necesita hoy. Bajo impacto (no es PII, son conteos agregados), pero es una violación de mínimo privilegio fácil de cerrar. |
| — (verificado) | El resto de funciones (`dashboard_orders_by_status`, `dashboard_paid_revenue`, `dashboard_top_products`, `dashboard_revenue_series`) solo tienen `GRANT ... TO service_role` | `dashboard-api-schema.sql:126-128,155` | Correcto, sin cambios. |
| — (verificado) | Sin SQL dinámico/`EXECUTE`/`format()` en ninguna de las 5 funciones — todos los parámetros (`p_since`, `p_until`, `p_period`, `p_limit`) son tipados (`date`, `text`, `integer`) y se usan como parámetros normales de PostgREST, nunca concatenados. `p_period` además se valida contra una whitelist (`VALID_PERIODS`) en el route handler antes de llegar a la función | `dashboard-api-schema.sql` completo, `finance-series/route.ts:28,48-50` | Sin inyección SQL posible. Sin hallazgo. |

---

## 4. Autenticación y sesión

### 4.1 `getCurrentClient()`/`getCurrentUser()` — caso límite de usuario sin vincular

Revisado el flujo completo: `middleware.ts` (`src/lib/supabase/middleware.ts:46-50`) solo comprueba que exista sesión para dejar pasar a `/dashboard` — no comprueba vínculo con `client_users` a propósito (comentario explícito: coste de una consulta extra por cada request/asset). `dashboard/layout.tsx` es quien hace el chequeo real: llama a `getCurrentClient()` (`src/lib/supabase/server.ts:85-104`), y si devuelve `null` (usuario autenticado pero sin fila en `client_users`, o la consulta falla), **no redirige** — muestra la pantalla "Cuenta sin vincular" (`dashboard/layout.tsx:30-43`) y para ahí: no se llama a `getClientStoreOptions()`, `getSelectedStore()` ni ningún otro dato de tienda antes de ese `return`.

**Verificado, sin hallazgo**: no hay ningún camino donde un usuario autenticado sin `client_users` llegue a ver datos de otra cuenta — el corte ocurre antes de pedir cualquier dato de tienda, y `getCurrentClient()` está en `cache()` de React así que no hay una segunda ejecución con resultado distinto dentro del mismo render.

### 4.2 CSRF

Next.js protege automáticamente las **Server Actions** (`'use server'`) comprobando `Origin` contra el host esperado — pero `healzyp-analytics` no usa Server Actions para mutaciones (`ConnectStoreForm.tsx` llama a `fetch('/api/stores', ...)`, `ProductActiveToggle` a `PATCH /api/products/[id]`), así que esa protección automática **no aplica** a ninguna ruta de este repo.

| Severidad | Hallazgo | Archivo:línea | Recomendación |
|---|---|---|---|
| Medio | `POST /api/stores` y `PATCH /api/products/[id]` son rutas JSON autenticadas por cookie de sesión (`getCurrentClient()`), sin comprobación explícita de `Origin`/`Sec-Fetch-Site`. En teoría, un formulario cross-site con `enctype="text/plain"` evita el preflight CORS y podría llegar al handler (que hace `req.json()` sin mirar `Content-Type`) | `src/app/api/stores/route.ts:28-39`, `src/app/api/products/[id]/route.ts:19-35` | Añadir la misma comprobación que ya existe en la tienda: `healzypp-clean/src/lib/security/origin-check.ts` (`isTrustedOrigin`) — copiar el patrón (10 líneas, sin dependencias) y llamarlo al inicio de ambos handlers, devolviendo 403 si falla. |
| — (mitigante ya presente, no ausencia total) | `@supabase/ssr` (usado por `createServerClient`/`createBrowserClient` en `src/lib/supabase/{server,client}.ts`) fija sus cookies de sesión con `SameSite=Lax` por defecto. Un POST cross-site (vía `fetch` o formulario) **no** adjunta cookies `Lax` en navegadores conformes — así que el vector de arriba está mitigado hoy en la práctica, pero es un supuesto sobre el comportamiento de una librería de terceros, no un control que el propio código verifique | — | La recomendación de arriba (Origin check explícito) convierte esta mitigación implícita en un control propio y verificable — mismo razonamiento que ya se aplicó en la auditoría de la tienda para este patrón exacto. |
| — (verificado, sin hallazgo) | `ChangePasswordForm.tsx` (`supabase.auth.updateUser()`) y `LogoutButton`/`login/page.tsx` (`signInWithPassword`) no pasan por ninguna ruta propia de `healzyp-analytics`: llaman directo al SDK de Supabase, que autentica con el `access_token` en el header `Authorization` (no con una cookie ambiente hacia el dominio de Supabase) — un sitio cross-site no puede forzar estas llamadas porque no tiene forma de leer/adjuntar ese token. Fuera del alcance de CSRF clásico. | `src/components/ChangePasswordForm.tsx:42-43`, `src/app/login/page.tsx:19-23` | Sin acción necesaria. |
| — (contexto) | Rate limiting de intentos de login | `src/app/login/page.tsx` | Igual que en la auditoría de la tienda: el login llama directo a Supabase Auth, cuyo propio rate limiting/protección de contraseñas filtradas vive en la configuración del proyecto Supabase, no en este código. Confirmar que está activado en el dashboard de Supabase del proyecto del SaaS. |

---

## 5. Rate limiting y DoS

| Severidad | Hallazgo | Archivo:línea | Recomendación |
|---|---|---|---|
| **Medio** | `healzyp-analytics` no tiene rate limiting en ningún punto — no hay ninguna dependencia de tipo `@upstash/ratelimit`/Redis en `package.json`, ni ningún limitador casero. Afecta en particular a `POST /api/stores` (el mismo endpoint del hallazgo #1): un atacante autenticado puede crear tiendas apuntando a hosts/puertos internos distintos tan rápido como quiera, acelerando el escaneo SSRF | `package.json` (sin `@upstash/*`); `src/app/api/stores/route.ts`, `src/app/api/orders/*`, `src/app/api/products/[id]/route.ts` | Añadir rate limiting al menos en `POST /api/stores` (por usuario/IP — p.ej. 5-10 tiendas nuevas por hora es más que suficiente para uso legítimo). Para los proxies de solo lectura (`/api/orders`, `/api/orders/[id]`, `/api/products/[id]`) el riesgo está ya acotado por el límite de la tienda (ver abajo), pero un límite propio es barato y cierra el hueco igual. |
| Bajo | `GET /api/dashboard/orders` (lista, en `healzypp-clean`) es el único endpoint `dashboard/*` sin `MAX_RANGE_DAYS` — `from`/`to` se pasan directo a `.gte()/.lte()` sin cota de rango. `stats` (90 días) y `finance-series` (366 días) sí lo aplican | `healzypp-clean/src/app/api/dashboard/orders/route.ts:52-53,79-80` vs `stats/route.ts:35,93-99` | Añadir el mismo patrón `MAX_RANGE_DAYS` por consistencia. Impacto ya limitado hoy por `limit`/`offset` acotados (`MAX_LIMIT = 500`) y por tener índice en `fecha_creacion`, pero el `count: 'exact'` en cada página sí escanea todo el rango pedido — un `from=1900-01-01` sigue siendo más caro de lo necesario. |
| — (verificado) | `MAX_RANGE_DAYS` se respeta en `stats` (90 días, `stats/route.ts:35,93-99`, devuelve 400 si se excede) y en `finance-series` (366 días, `finance-series/route.ts:27,64-70`) | — | Confirmado — un `from=1900-01-01` en cualquiera de estos dos devuelve `400` antes de tocar Supabase. |
| — (verificado) | Rate limiting de `/api/dashboard/*` en la tienda | `healzypp-clean/src/lib/dashboard-api-auth.ts:58-78` (`dashboardApiRatelimit`, 60 req/min **por token**, no por IP — así que sigue aplicando aunque el abuso venga repartido entre IPs) | Confirmado que sigue activo tras los cambios recientes — cada llamada a `authenticateDashboardRequest()` (las 6 rutas `dashboard/*`) lo invoca antes de tocar Supabase. Sin hallazgo. |
| — (analizado) | Polling de 20s × varias tiendas/clientes simultáneos como vector de carga sobre las tiendas de los clientes | `src/components/AutoRefresh.tsx`, montado en `/dashboard` y `/dashboard/map` | El diseño ya aísla esto bien: cada cliente del SaaS solo dispara tráfico contra **su propia** tienda (con su propio token), nunca contra la de otro — no hay amplificación cruzada entre clientes. Por cliente: dos pestañas abiertas (`/dashboard` + `/dashboard/map`) generan ~6 req/min contra esa tienda, muy por debajo de los 60/min que admite `dashboardApiRatelimit`. El vector real no es el polling normal sino que, como `healzyp-analytics` no limita nada en su propio lado (hallazgo de arriba), un script que ignore el intervalo de 20s y golpee `/dashboard` en bucle rápido **sí** puede agotar el presupuesto de 60 req/min de su propia tienda antes de lo esperado — pero el daño queda contenido a la propia tienda del atacante (autolesión), no afecta a otros clientes. |

---

## 6. XSS y validación de input

Revisado cada punto donde el dashboard renderiza texto que viene de la tienda externa: nombre de producto (`ProductCard.tsx:27`, `OrderDetailDrawer.tsx:159`), categoría (`ProductCard.tsx:29`), nombre/email/teléfono/dirección/notas del cliente final (`OrderDetailDrawer.tsx:194-197,209`), país/ciudad en el mapa (`WorldMap.tsx`), página más visitada (`PagesNowCard.tsx`, vía `describePage()`).

| Severidad | Hallazgo | Archivo:línea | Recomendación |
|---|---|---|---|
| — (verificado, sin hallazgo) | `grep -r dangerouslySetInnerHTML src/` en `healzyp-analytics`: **cero resultados**. Todo el texto proveniente de la API de la tienda se interpola con `{...}` de JSX, que React escapa automáticamente | Todo `src/components/*.tsx`, `src/app/dashboard/**/*.tsx` | Sin acción necesaria — es el comportamiento por defecto correcto y se respeta en el 100% de los puntos revisados. |
| — (verificado, sin hallazgo — el único punto que sí inyecta HTML crudo, y lo hace bien) | `WorldMap.tsx` usa la prop `pointLabel` de `react-globe.gl`, que **sí** inserta el string devuelto como HTML sin pasar por React. El código ya es consciente de esto: `tooltipHtml()` llama a `escapeHtml()` (línea 44-50, escapa `&`, `<`, `>`, `"`) sobre **cada** valor de texto interpolado (`p.countryName` en línea 63, `c.name` en línea 57) antes de meterlo en el template string. `countryName` sale de una tabla estática propia (`src/lib/geo/country-centroids.ts`), pero `c.name` (ciudad) sí viene de la tienda (`tracking_sessions.city`, potencialmente influenciable por quien controle lo que reporta el visitante) — y está escapado igualmente, así que aunque llegara `</div><img src=x onerror=alert(1)>` como nombre de ciudad, se renderiza como texto literal, no como HTML | `src/components/WorldMap.tsx:44-68` | Sin acción — implementación correcta. Única sugerencia menor: si en el futuro se añade cualquier otro campo de la tienda a este tooltip, pasarlo también por `escapeHtml()` (fácil de olvidar al no ser el patrón por defecto de React en el resto del código). |
| — (fuera de alcance de este SaaS, verificado igualmente) | `healzypp-clean` sí tiene 2 usos de `dangerouslySetInnerHTML`: JSON-LD de producto (`app/shop/product/[...slug]/page.tsx:148,154`) y el `<noscript>` del píxel de Meta (`components/tracking/MetaPixel.tsx:42`) — ninguno de los dos renderiza datos que pasen por `/api/dashboard/*` ni por `healzyp-analytics` | `healzypp-clean/src/app/shop/product/[...slug]/page.tsx`, `.../MetaPixel.tsx` | Fuera del alcance de esta auditoría (no forman parte del flujo del SaaS) — ya cubierto conceptualmente por el alcance de `docs/audit-full*.md` si se quiere revisar el JSON de structured data en detalle. |

---

## 7. Dependencias — `npm audit`

### `healzyp-analytics`

```
3 high severity vulnerabilities
- postcss <=8.5.17 (vía next@16.2.11): XSS en output de CSS stringify, lectura arbitraria de archivos vía sourceMappingURL, path traversal en sourcemaps
- sharp <0.35.0: vulnerabilidades heredadas de libvips (CVE-2026-33327/33328/35590/35591)
fix disponible vía `npm audit fix --force` (instalaría next@9.3.3 — downgrade mayor, no recomendable sin más contexto)
```

### `healzypp-clean`

```
5 high severity vulnerabilities
- brace-expansion <1.1.16 || >=3.0.0 <5.0.7: DoS por expansión exponencial de grupos {}
- js-yaml 4.0.0-4.2.0: consumo cuadrático de CPU vía merge-key chains
- next 9.3.4-canary.0 - 16.3.0-preview.7 (instalada: 16.2.6): 9 advisories, incluye:
  - SSRF en Server Actions con servidor custom (GHSA-89xv-2m56-2m9x)
  - SSRF en rewrites vía hostname de destino controlado por atacante (GHSA-p9j2-gv94-2wf4)
  - Bypass de Middleware/Proxy en App Router con Turbopack + locale único
  - Varias de DoS (Server Actions, Image Optimization con SVG)
  - Divulgación no autenticada de endpoints internos de Server Functions
- postcss / sharp: mismas que en healzyp-analytics
fix disponible vía `npm audit fix` (sin --force, no rompe versión mayor)
```

| Severidad | Hallazgo | Recomendación |
|---|---|---|
| Alto (CVSS) / riesgo real bajo-medio hoy | `next@16.2.6` en `healzypp-clean` acarrea 2 advisories de SSRF propios del framework (Server Actions con servidor custom, rewrites) — **distintos** del SSRF de aplicación descrito en la sección 1 (ese es un `fetch()` de este código, no un bug de Next.js), pero conviene no confundirlos ni descartar uno pensando que el otro ya lo cubre | Actualizar a la versión parcheada dentro de la misma major (`npm audit fix`, sin `--force`) — no requiere downgrade en este repo. Confirmar que no se usa `output: 'standalone'` con servidor custom (el vector de uno de los SSRF) ni `rewrites()` con destino dinámico controlable externamente antes de descartar el hallazgo como no aplicable. |
| Alto (CVSS) / bajo riesgo real | `postcss`/`sharp` en ambos repos — vectores de build-time/procesado de imágenes, no de request en producción tal y como se usan aquí (sin subida de imágenes ni CSS generado desde input de usuario en ninguno de los dos repos) | Priorizar el resto de hallazgos de esta auditoría primero; luego evaluar `npm audit fix --force` en `healzyp-analytics` con cuidado (implica downgrade de `next`, probar build completo antes de aceptarlo) o esperar a que `next` publique un patch que no requiera downgrade. |
| Medio | `brace-expansion`/`js-yaml` en `healzypp-clean` — dependencias de tooling (`typescript-eslint`, probablemente config de build), no de código servido en producción | `npm audit fix` sin `--force` ya las resuelve — bajo riesgo, aplicar en la próxima ventana de mantenimiento. |

---

## Plan de fixes priorizado

### Fase 1 — Crítico/Alto, con riesgo real de red interna (inmediato)
1. **SSRF** (§1): validar el host resuelto contra un bloqueo de rangos privados/loopback/link-local/metadata **dentro de `fetchStoreApi()`** (no solo al conectar), desactivar redirecciones automáticas (`redirect: 'manual'`) y revalidar manualmente si se sigue un salto.
2. **Forzar `https:` en `url_tienda`** en producción (§1 y §2) — cierra de paso la transmisión en claro del token.
3. **Limitar el tamaño de la respuesta** en `fetchStoreApi()` antes de `res.json()` (§1.3).

### Fase 2 — Alto/Medio, cierre de huecos estructurales
4. Rate limiting propio en `POST /api/stores` como mínimo, idealmente también en los proxies de lectura (§5).
5. Flujo de rotación de `api_token` (endpoint + UI en Configuración) (§2).
6. Origin/Sec-Fetch-Site check en `POST /api/stores` y `PATCH /api/products/[id]`, reusando el patrón ya validado en `healzypp-clean/src/lib/security/origin-check.ts` (§4.2).

### Fase 3 — Bajo, limpieza y consistencia
7. `REVOKE EXECUTE ... FROM authenticated` en `dashboard_daily_visitors` (§3.2).
8. `MAX_RANGE_DAYS` en `GET /api/dashboard/orders` por consistencia con `stats`/`finance-series` (§5).
9. `npm audit fix` (sin `--force`) en ambos repos; evaluar el downgrade de `next` en `healzyp-analytics` aparte, con build completo de por medio.

### Sin acción necesaria (verificado correcto, mantener la convención)
RLS de las 5 tablas del SaaS; ausencia de `service_role` en `healzyp-analytics`; comparación de token en tiempo constante; `MAX_RANGE_DAYS` en `stats`/`finance-series`; validación UUID de IDs; escaping en `WorldMap.tsx`; ausencia total de `dangerouslySetInnerHTML` en el resto del dashboard; aislamiento de `getCurrentClient()` ante usuarios sin vincular.
