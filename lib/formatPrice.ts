/**
 * Formatea un precio en pesos chilenos (CLP)
 * @param price - Precio en número
 * @returns String formateado con formato chileno (ej: $12.345)
 */
export function formatPrice(price: number): string {
  // Redondear a número entero para evitar decimales
  const precioRedondeado = Math.round(price)
  return `$${precioRedondeado.toLocaleString('es-CL', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`
}

