import { Home, Package, CreditCard, ShoppingCart, LayoutGrid, Newspaper, User, Globe } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type PageTypeKey = 'home' | 'producto' | 'checkout' | 'carrito' | 'categoria' | 'blog' | 'cuenta' | 'otros'

type PageTypeStyle = { icon: LucideIcon; bg: string; text: string }

// Colores categóricos por tipo de página — mismo patrón que CATEGORY_STYLES
// en FinanceMetricCards: paleta arbitraria y consistente por tipo, sin
// relación con STATUS_COLORS (esto no son estados).
const PAGE_TYPE_STYLES: Record<PageTypeKey, PageTypeStyle> = {
  home: { icon: Home, bg: '#dbeafe', text: '#2563eb' },
  producto: { icon: Package, bg: '#ede9fe', text: '#7c3aed' },
  checkout: { icon: CreditCard, bg: '#fef3c7', text: '#d97706' },
  carrito: { icon: ShoppingCart, bg: '#fce7f3', text: '#db2777' },
  categoria: { icon: LayoutGrid, bg: '#ccfbf1', text: '#0d9488' },
  blog: { icon: Newspaper, bg: '#e0e7ff', text: '#4f46e5' },
  cuenta: { icon: User, bg: '#f1f5f9', text: '#475569' },
  otros: { icon: Globe, bg: '#ecfeff', text: '#0891b2' },
}

const FIXED_LABELS: Partial<Record<PageTypeKey, string>> = {
  home: 'Inicio',
  checkout: 'Checkout',
  carrito: 'Carrito',
  cuenta: 'Mi cuenta',
}

function classifyPageType(path: string): PageTypeKey {
  if (path === '/') return 'home'
  if (/^\/(producto|products?)\b/.test(path)) return 'producto'
  if (/^\/checkout\b/.test(path)) return 'checkout'
  if (/^\/(carrito|cart)\b/.test(path)) return 'carrito'
  if (/^\/(categoria|coleccion|category|collections?)\b/.test(path)) return 'categoria'
  if (/^\/blog\b/.test(path)) return 'blog'
  if (/^\/(cuenta|mi-cuenta|account)\b/.test(path)) return 'cuenta'
  return 'otros'
}

function humanizeSlug(segment: string): string {
  return segment.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function shortPageLabel(path: string, type: PageTypeKey): string {
  const fixed = FIXED_LABELS[type]
  if (fixed) return fixed

  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return path
  return humanizeSlug(segments[segments.length - 1])
}

export type PageDisplay = { label: string; icon: LucideIcon; bg: string; text: string }

/** Icono, color y nombre corto para mostrar una ruta real en una mini-tarjeta. */
export function describePage(path: string): PageDisplay {
  const type = classifyPageType(path)
  const style = PAGE_TYPE_STYLES[type]
  return { label: shortPageLabel(path, type), icon: style.icon, bg: style.bg, text: style.text }
}
