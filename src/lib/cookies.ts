// Nombre de la cookie de tienda seleccionada, compartido entre src/lib/stores.ts
// (server, lee la cookie con next/headers) y src/components/StoreSelector.tsx
// (client, la escribe con document.cookie). Vive en su propio archivo, sin
// ningún import server-only, para que el componente cliente pueda importar
// esta constante sin arrastrar next/headers (ni el resto de src/lib/stores.ts)
// al bundle del navegador.
export const SELECTED_STORE_COOKIE_NAME = 'selected_store_id'
