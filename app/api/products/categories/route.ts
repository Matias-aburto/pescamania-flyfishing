import { NextResponse } from 'next/server'
import { PRODUCT_CATEGORIES } from '@/lib/constants'

// Categorías son estáticas, cachear por 1 hora
export const revalidate = 3600

export async function GET() {
  try {
    // Retornar las categorías predefinidas
    return NextResponse.json(Array.from(PRODUCT_CATEGORIES), {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, s-maxage=3600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}

