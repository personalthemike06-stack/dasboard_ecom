import worldCountries from 'world-countries'

export type CountryCentroid = { name: string; lat: number; lng: number }

/**
 * tracking_sessions.country guarda un ISO-3166-1 alpha-2 (2 letras), pero la
 * tabla no tiene lat/lng — no hay geocodificación a nivel de ciudad. Usamos
 * el centroide aproximado del país (world-countries) como posición del punto
 * en el mapa; la ciudad se muestra en el tooltip, no como coordenada propia.
 */
const CENTROIDS: Map<string, CountryCentroid> = new Map(
  worldCountries.map((c) => [
    c.cca2.toUpperCase(),
    { name: c.name.common, lat: c.latlng[0], lng: c.latlng[1] },
  ])
)

export function getCountryCentroid(alpha2: string | null): CountryCentroid | null {
  if (!alpha2) return null
  return CENTROIDS.get(alpha2.toUpperCase()) ?? null
}
