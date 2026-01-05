/**
 * Helper para agregar parámetro de versión a URLs de imágenes
 * Esto evita problemas de caché cuando se actualiza una imagen
 */

export function getImageUrl(imageUrl: string | null | undefined, updatedAt?: string): string {
  if (!imageUrl) return ''
  
  // Si la URL ya tiene un parámetro 'v', reemplazarlo
  // Esto asegura que siempre usemos la versión más reciente
  const urlWithoutVersion = imageUrl.split('?')[0]
  const existingParams = imageUrl.includes('?') ? imageUrl.split('?')[1] : ''
  const params = new URLSearchParams(existingParams)
  
  // Usar updatedAt como versión, o timestamp actual si no está disponible
  const version = updatedAt ? new Date(updatedAt).getTime() : Date.now()
  params.set('v', version.toString())
  
  return `${urlWithoutVersion}?${params.toString()}`
}

