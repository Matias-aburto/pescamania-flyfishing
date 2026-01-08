import { NextResponse } from 'next/server'
import { listarCiudadesDestino } from '@/lib/starken'

// Cache largo para ciudades (1 hora, cambian poco)
export const revalidate = 3600

export async function GET() {
  try {
    const ciudades = await listarCiudadesDestino()
    console.log(`[API] Ciudades de destino obtenidas: ${ciudades.length}`)

    return NextResponse.json(ciudades, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, s-maxage=3600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error en /api/shipping/cities/destination:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Detalles del error:', errorMessage)
    
    // Retornar array vacío en lugar de error para no romper el build
    // El frontend manejará el caso cuando no haya ciudades
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  }
}

