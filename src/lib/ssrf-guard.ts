import { isIP, isIPv4, isIPv6 } from 'node:net'
import { lookup as dnsLookup, promises as dnsPromises } from 'node:dns'
import type { LookupAddress, LookupOneOptions, LookupAllOptions } from 'node:dns'
import { buildConnector } from 'undici'

// ─────────────────────────────────────────────────────────────────────────────
// Bloqueo de SSRF hacia red interna/privada — usado tanto para el chequeo
// "amigable" al conectar una tienda (POST /api/stores) como, sobre todo, para
// el `lookup` real del dispatcher de fetch en cada petición (ver
// src/lib/store-api.ts). Es ESTE segundo uso el que de verdad cierra el hueco:
// como el `lookup` personalizado es el mismo que usa el socket para conectar,
// no hay ventana entre "resolver para validar" y "resolver para conectar" —
// no hace falta confiar en que el DNS no cambie de respuesta entre medias
// (DNS rebinding). Validar solo al guardar la URL de la tienda no sirve de
// nada por sí solo: un host público en el momento de conectar la tienda
// puede apuntar a 169.254.169.254 en la petición real, minutos u horas
// después.
// ─────────────────────────────────────────────────────────────────────────────

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let result = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null
    const n = Number(part)
    if (n > 255) return null
    result = (result << 8) | n
  }
  return result >>> 0
}

function isIPv4InCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split('/')
  const bits = Number(bitsStr)
  const ipInt = ipv4ToInt(ip)
  const rangeInt = ipv4ToInt(range)
  if (ipInt === null || rangeInt === null) return false
  if (bits === 0) return true
  const mask = bits >= 32 ? 0xffffffff : (~0 << (32 - bits)) >>> 0
  return (ipInt & mask) === (rangeInt & mask)
}

// Link-local/metadata de nube, RFC1918, "esta red" y CGNAT — lista exacta
// pedida en la auditoría (audit-saas-security.md §1.3). Loopback (127.0.0.0/8,
// ::1) se trata aparte más abajo — es el único rango que SÍ se permite fuera
// de producción, ver isLoopbackAddress()/ALLOW_LOOPBACK.
const BLOCKED_IPV4_CIDRS = [
  '169.254.0.0/16',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  '0.0.0.0/8',
  '100.64.0.0/10',
]

const LOOPBACK_IPV4_CIDR = '127.0.0.0/8'

function isBlockedIPv4(ip: string): boolean {
  return BLOCKED_IPV4_CIDRS.some((cidr) => isIPv4InCidr(ip, cidr))
}

/**
 * IPv6 (sin depender de una librería de CIDR) → BigInt de 128 bits, con
 * soporte de "::" y de IPv4 embebida en el último tramo (p.ej. ::ffff:1.2.3.4
 * o ::1.2.3.4) — necesario para poder desenvolver direcciones IPv4-mapeadas
 * más abajo.
 */
function ipv6ToBigInt(ip: string): bigint | null {
  if (!isIPv6(ip)) return null

  const zoneIdx = ip.indexOf('%')
  const address = zoneIdx === -1 ? ip : ip.slice(0, zoneIdx)

  const doubleColonIdx = address.indexOf('::')
  const headStr = doubleColonIdx === -1 ? address : address.slice(0, doubleColonIdx)
  const tailStr = doubleColonIdx === -1 ? '' : address.slice(doubleColonIdx + 2)

  function partsToGroups(s: string): number[] | null {
    if (s === '') return []
    const rawParts = s.split(':')
    const groups: number[] = []
    for (const part of rawParts) {
      if (part.includes('.')) {
        const v4 = ipv4ToInt(part)
        if (v4 === null) return null
        groups.push((v4 >>> 16) & 0xffff, v4 & 0xffff)
      } else {
        if (!/^[0-9a-fA-F]{1,4}$/.test(part)) return null
        groups.push(parseInt(part, 16))
      }
    }
    return groups
  }

  const headGroups = partsToGroups(headStr)
  const tailGroups = partsToGroups(tailStr)
  if (headGroups === null || tailGroups === null) return null

  const missing = 8 - headGroups.length - tailGroups.length
  if (missing < 0) return null
  const allGroups = [...headGroups, ...Array(missing).fill(0), ...tailGroups]
  if (allGroups.length !== 8) return null

  let result = BigInt(0)
  for (const g of allGroups) {
    result = (result << BigInt(16)) | BigInt(g)
  }
  return result
}

function isIPv6InRange(ip: string, rangePrefix: string, prefixLen: number): boolean {
  const ipBig = ipv6ToBigInt(ip)
  const rangeBig = ipv6ToBigInt(rangePrefix)
  if (ipBig === null || rangeBig === null) return false
  const shift = BigInt(128 - prefixLen)
  return (ipBig >> shift) === (rangeBig >> shift)
}

/** ::ffff:a.b.c.d → "a.b.c.d", o null si no es una IPv4-mapeada. */
function extractIPv4Mapped(ip: string): string | null {
  const big = ipv6ToBigInt(ip)
  if (big === null) return null
  if (big >> BigInt(32) !== BigInt(0xffff)) return null
  const v4 = Number(big & BigInt(0xffffffff))
  return [(v4 >>> 24) & 0xff, (v4 >>> 16) & 0xff, (v4 >>> 8) & 0xff, v4 & 0xff].join('.')
}

/** true si la IP (v4 o v6, ya resuelta) es loopback. */
function isLoopbackAddress(ip: string): boolean {
  if (isIPv4(ip)) return isIPv4InCidr(ip, LOOPBACK_IPV4_CIDR)
  if (isIPv6(ip)) {
    if (ip === '::1') return true
    const mapped = extractIPv4Mapped(ip)
    return mapped !== null && isIPv4InCidr(mapped, LOOPBACK_IPV4_CIDR)
  }
  return false
}

// Next.js fija NODE_ENV=production en CUALQUIER build (`next build`), tanto
// para un despliegue de Producción como para un Preview de Vercel — solo
// `next dev` (servidor local del propio desarrollador) deja
// NODE_ENV=development. Por eso esta condición basta para "solo en mi
// máquina, nunca en nada desplegado": no depende de una variable nueva que
// alguien tenga que recordar poner o quitar, y no hay forma de que quede
// puesta por error en un entorno real. Aprobado explícitamente antes de
// aplicarlo, ver audit-saas-security.md §1 (nota de la Fase 1 sobre
// loopback vs pruebas locales).
const ALLOW_LOOPBACK = process.env.NODE_ENV !== 'production'

/** true si la IP (v4 o v6, ya resuelta) no debe ser alcanzable desde este servidor. */
export function isBlockedAddress(ip: string): boolean {
  if (isLoopbackAddress(ip)) {
    return !ALLOW_LOOPBACK
  }

  if (isIPv4(ip)) return isBlockedIPv4(ip)

  if (isIPv6(ip)) {
    if (isIPv6InRange(ip, 'fe80::', 10)) return true // link-local v6
    const mapped = extractIPv4Mapped(ip)
    if (mapped && isBlockedIPv4(mapped)) return true
    return false
  }

  // Formato irreconocible — nunca hemos visto esto en la práctica (dns.lookup
  // solo devuelve IPv4/IPv6 válidas), pero si pasara, bloquear por precaución
  // en vez de dejar pasar algo que no sabemos clasificar.
  return true
}

/**
 * http:// solo se permite hacia loopback (desarrollo local con
 * http://localhost:puerto) — cualquier otro host debe usar https:, para que
 * el Bearer token de la tienda no viaje en claro por una red real. Exige que
 * TODAS las direcciones resueltas sean loopback (no solo la primera): si un
 * hostname resolviera a una mezcla, sería una señal rara que no merece el
 * beneficio de la duda. Ver audit-saas-security.md §2 — aprobado por el
 * usuario antes de implementarlo.
 */
export async function isHttpAllowedForHostname(hostname: string): Promise<boolean> {
  try {
    const results = await dnsPromises.lookup(hostname, { all: true, verbatim: true })
    return results.length > 0 && results.every((r) => isLoopbackAddress(r.address))
  } catch {
    return false
  }
}

export type HostValidation = { ok: true } | { ok: false; reason: string }

/**
 * Chequeo "amigable" al conectar una tienda (POST /api/stores) — falla rápido
 * con un mensaje claro en el caso común. NO es la protección real: un host
 * puede resolver a una IP pública ahora mismo y a una privada en la próxima
 * petición (DNS rebinding). Esa protección de verdad vive en el `lookup`
 * personalizado de abajo, usado por el dispatcher de cada fetch real.
 */
export async function validateHostnameForConnect(hostname: string): Promise<HostValidation> {
  let results: LookupAddress[]
  try {
    results = await dnsPromises.lookup(hostname, { all: true, verbatim: true })
  } catch {
    return { ok: false, reason: 'No se pudo resolver esa dirección.' }
  }

  if (results.length === 0) {
    return { ok: false, reason: 'Esa dirección no resolvió a ningún host.' }
  }

  if (results.some((r) => isBlockedAddress(r.address))) {
    return { ok: false, reason: 'Esa URL apunta a una dirección de red interna/privada, no permitida.' }
  }

  return { ok: true }
}

export function createSsrfBlockedError(): NodeJS.ErrnoException {
  const err = new Error(
    'SSRF_BLOCKED: la dirección resuelta apunta a una red interna/privada no permitida'
  ) as NodeJS.ErrnoException
  err.code = 'SSRF_BLOCKED'
  return err
}

type NodeLookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number
) => void

/**
 * `lookup` compatible con la firma de `dns.lookup`, para pasarlo a
 * `connect.lookup` de un Agent de undici (ver createSsrfSafeDispatcher() en
 * src/lib/store-api.ts). Siempre resuelve TODAS las direcciones y filtra las
 * bloqueadas antes de devolver nada — si no queda ninguna permitida, el
 * callback recibe un error y undici nunca llega a abrir el socket. Como esta
 * función ES la resolución que realmente usa la conexión (no una resolución
 * aparte solo para "mirar"), no hay ventana de tiempo entre validar y
 * conectar: cierra el DNS rebinding en vez de solo mitigarlo.
 */
export function ssrfSafeLookup(
  hostname: string,
  options: LookupOneOptions | LookupAllOptions | number | undefined,
  callback: NodeLookupCallback
): void {
  const opts = typeof options === 'object' && options !== null ? options : {}
  const wantsAll = typeof options === 'object' && options !== null && 'all' in options ? Boolean(options.all) : false

  dnsLookup(hostname, { ...opts, all: true }, (err, addresses) => {
    if (err) {
      callback(err, [])
      return
    }

    const list = addresses as unknown as LookupAddress[]
    const allowed = list.filter((a) => !isBlockedAddress(a.address))

    if (allowed.length === 0) {
      callback(createSsrfBlockedError(), [])
      return
    }

    if (wantsAll) {
      callback(null, allowed)
    } else {
      callback(null, allowed[0].address, allowed[0].family)
    }
  })
}

const baseConnector = buildConnector({ lookup: ssrfSafeLookup })

/**
 * Connector para el Agent de undici que usa store-api.ts. `ssrfSafeLookup`
 * (arriba) cierra el caso "URL con hostname" — pero comprobado a mano
 * (ver audit-saas-security.md, verificación de la Fase 1): cuando el host ya
 * es una IP literal (p.ej. url_tienda = http://169.254.169.254/), Node NUNCA
 * llama a `lookup` — net.connect/tls.connect conectan directo sin pasar por
 * resolución de nombres, así que una tienda con IP literal se saltaba el
 * filtro por completo. Este connector comprueba la IP literal ANTES de
 * delegar en el connector base (que sí aplica ssrfSafeLookup para
 * hostnames), cubriendo los dos casos.
 */
export function ssrfSafeConnector(
  options: Parameters<ReturnType<typeof buildConnector>>[0],
  callback: Parameters<ReturnType<typeof buildConnector>>[1]
): void {
  const hostname = options.hostname
  if (isIP(hostname) && isBlockedAddress(hostname)) {
    callback(createSsrfBlockedError(), null)
    return
  }
  baseConnector(options, callback)
}
