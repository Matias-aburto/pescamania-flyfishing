// Placeholder para productos sin imagen
export const PLACEHOLDER_IMAGE = '/placeholder-fly.svg'

// Categorías predefinidas
export const PRODUCT_CATEGORIES = [
  'Secas',
  'Ninfas',
  'Perdigones',
  'Streamers',
  'Wet'
] as const

export type ProductCategory = typeof PRODUCT_CATEGORIES[number]
