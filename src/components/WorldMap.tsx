'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import worldTopology from 'world-atlas/countries-110m.json'
import type { GlobeMethods } from 'react-globe.gl'
import * as THREE from 'three'
import { Skeleton } from '@/components/Skeleton'

// three.js/globe.gl tocan `window`/WebGL en el módulo — cargarlo en SSR
// tira el build. 'use client' arriba hace esto válido (ver
// node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md).
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false })

export type MapPoint = {
  key: string
  lat: number
  lng: number
  count: number
  countryName: string
  cities: { name: string; count: number }[]
}

// Mismos tonos slate que el resto del dashboard (bg-slate-50, border-slate-200…)
// para que el globo no desentone con el resto de tarjetas.
const OCEAN_COLOR = '#f8fafc'
const LAND_COLOR = '#dbe2ea'
const LAND_STROKE_COLOR = '#b9c4d0'
const POINT_COLOR = '#3b82f6'
const POINT_COLOR_RGB = '59, 130, 246'

const MIN_HEIGHT = 320
const MAX_HEIGHT = 520

// Radio angular (grados) proporcional al área (sqrt), no al radio — así el
// ojo compara magnitudes correctamente en vez de exagerar los puntos grandes.
function radiusFor(count: number, maxCount: number) {
  if (maxCount <= 1) return 0.4
  const t = Math.sqrt(count) / Math.sqrt(maxCount)
  return 0.35 + t * 1.55
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function tooltipHtml(p: MapPoint) {
  const citiesHtml = p.cities
    .slice(0, 5)
    .map(
      (c) =>
        `<div style="font-size:11px;color:#94a3b8;">${escapeHtml(c.name)} · ${c.count}</div>`
    )
    .join('')

  return `
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;box-shadow:0 4px 12px rgba(15,23,42,0.12);font-family:Arial,Helvetica,sans-serif;min-width:140px;">
      <div style="font-weight:600;color:#0f172a;font-size:13px;">${escapeHtml(p.countryName)}</div>
      <div style="color:#64748b;font-size:12px;">${p.count} ${p.count === 1 ? 'sesión activa' : 'sesiones activas'}</div>
      ${citiesHtml}
    </div>
  `
}

export function WorldMap({ points }: { points: MapPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0
      setSize({
        width,
        height: Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, width * 0.6)),
      })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const countries = useMemo(() => {
    const topology = worldTopology as unknown as Topology
    const countriesGeo = feature(
      topology,
      topology.objects.countries as GeometryCollection
    )
    return 'features' in countriesGeo ? countriesGeo.features : [countriesGeo]
  }, [])

  // Materiales "unlit" (MeshBasicMaterial): three-globe sombrea el globo y
  // los países con luz direccional por defecto, lo que deja medio planeta a
  // oscuras — justo lo contrario de "limpio y luminoso". Sin dependencia de
  // luces, el color se ve igual en toda la esfera.
  const globeMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: OCEAN_COLOR }),
    []
  )
  const landCapMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: LAND_COLOR }),
    []
  )
  const landSideMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: LAND_COLOR,
        transparent: true,
        opacity: 0.5,
      }),
    []
  )

  const maxCount = Math.max(1, ...points.map((p) => p.count))

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-lg"
      style={{ background: OCEAN_COLOR }}
    >
      {size.width === 0 && <Skeleton className="h-[400px] w-full rounded-lg" />}
      {size.width > 0 && (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="#ffffff"
          globeImageUrl={null}
          globeMaterial={globeMaterial}
          showAtmosphere
          atmosphereColor="#dbe4f0"
          atmosphereAltitude={0.18}
          polygonsData={countries}
          polygonCapMaterial={() => landCapMaterial}
          polygonSideMaterial={() => landSideMaterial}
          polygonStrokeColor={() => LAND_STROKE_COLOR}
          polygonAltitude={0.006}
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor={() => POINT_COLOR}
          pointAltitude={0.015}
          pointRadius={(d) => radiusFor((d as MapPoint).count, maxCount)}
          pointLabel={(d) => tooltipHtml(d as MapPoint)}
          pointsTransitionDuration={700}
          // Anillo pulsante ("glow sutil") sobre cada punto con sesiones —
          // capa nativa de three-globe, no CSS: en un canvas WebGL no hay
          // otra forma de animar sobre la esfera.
          ringsData={points}
          ringLat="lat"
          ringLng="lng"
          ringColor={() => (t: number) => `rgba(${POINT_COLOR_RGB}, ${(1 - t) * 0.5})`}
          ringMaxRadius={(d) => radiusFor((d as MapPoint).count, maxCount) * 3.2}
          ringPropagationSpeed={2}
          ringRepeatPeriod={1700}
          onGlobeReady={() =>
            globeRef.current?.pointOfView({ lat: 15, lng: 10, altitude: 2.1 }, 0)
          }
        />
      )}
    </div>
  )
}
