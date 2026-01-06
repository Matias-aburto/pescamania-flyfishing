import { NextResponse } from 'next/server'
import { getProductBySlug } from '@/lib/products'

// Revalidar cada 30 segundos
export const revalidate = 30

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await getProductBySlug(params.slug)
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }
    
    // Cachear con revalidación
    return NextResponse.json(product, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, s-maxage=30',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=30',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    )
  }
}

