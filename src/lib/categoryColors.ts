/** Warm, muted palette matching the kovo brand — used when a category has no custom color set. */
const FALLBACK_PALETTE = [
  '#c9a27c', // tan
  '#8a5a3f', // terracotta
  '#4d7358', // sage
  '#5b7a94', // slate blue
  '#a34c3f', // rust
  '#8a7ba8', // muted violet
  '#b08c3f', // ochre
  '#6b8f7a', // eucalyptus
  '#9c6b8f', // mauve
  '#7a8a5b', // olive
]

export function getCategoryColor(category: { id: string; color: string | null }) {
  if (category.color) return category.color
  let hash = 0
  for (let i = 0; i < category.id.length; i++) {
    hash = (hash * 31 + category.id.charCodeAt(i)) >>> 0
  }
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length]
}
