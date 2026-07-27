import { Leaf, Package, ShoppingBag, Sparkles, Tag, type LucideIcon } from 'lucide-react'

// 5 pares icono+color predefinidos — categoria (texto libre, sin tabla
// propia, ver products/page.tsx) se hashea a uno de estos de forma estable,
// así la misma categoría siempre cae en el mismo par sin necesitar mantener
// un mapeo manual por cada valor que exista en la tienda.
const CATEGORY_STYLES: { icon: LucideIcon; bg: string; text: string }[] = [
  { icon: Sparkles, bg: '#fce7f3', text: '#db2777' },
  { icon: Leaf, bg: '#dcfce7', text: '#16a34a' },
  { icon: Package, bg: '#dbeafe', text: '#2563eb' },
  { icon: ShoppingBag, bg: '#fef3c7', text: '#b45309' },
  { icon: Tag, bg: '#ede9fe', text: '#7c3aed' },
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function categoryStyle(categoria: string | null) {
  const key = categoria?.trim() || 'sin-categoria'
  return CATEGORY_STYLES[hashString(key) % CATEGORY_STYLES.length]
}
