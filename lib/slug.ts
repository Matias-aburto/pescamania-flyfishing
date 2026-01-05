/**
 * Genera un slug amigable desde un texto
 * Ejemplo: "Copper John" -> "copper-john"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Normaliza caracteres con acentos
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos
    .trim()
    .replace(/[^\w\s-]/g, '') // Elimina caracteres especiales
    .replace(/[\s_-]+/g, '-') // Reemplaza espacios y guiones bajos con guiones
    .replace(/^-+|-+$/g, '') // Elimina guiones al inicio y final
}

/**
 * Genera un slug único agregando un número si es necesario
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug
  let counter = 1
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

