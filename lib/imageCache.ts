/**
 * Helper para agregar parámetro de versión a URLs de imágenes
 * Esto evita problemas de caché cuando se actualiza una imagen
 */

export function getImageUrl(imageUrl: string | null | undefined, updatedAt?: string): string {
  if (!imageUrl) return ''
  
  // Si es una URL relativa que empieza con /, no modificar
  // Si es una URL absoluta, agregar parámetro de versión
  if (imageUrl.startsWith('/')) {
    // URL relativa - agregar parámetro de versión
    const separator = imageUrl.includes('?') ? '&' : '?'
    const version = updatedAt ? new Date(updatedAt).getTime() : Date.now()
    return `${imageUrl}${separator}v=${version}`
  }
  
  // URL absoluta (Supabase Storage, CDN, etc.)
  // Si la URL ya tiene parámetros, agregar el nuevo, sino agregar con ?
  const separator = imageUrl.includes('?') ? '&' : '?'
  
  // Usar updatedAt como versión, o timestamp actual si no está disponible
  const version = updatedAt ? new Date(updatedAt).getTime() : Date.now()
  
  return `${imageUrl}${separator}v=${version}`
}

