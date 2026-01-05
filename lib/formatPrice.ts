/**
 * Formatea un precio en pesos chilenos (CLP)
 * @param price - Precio en número
 * @returns String formateado con formato chileno (ej: $12.345)
 */
export function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-CL')}`
}

