import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/products'

// Revalidar cada 30 segundos (balance entre frescura y uso de recursos)
export const revalidate = 30

export async function GET() {
  try {
    const products = await getProducts()
    
    // Cachear con revalidación: los datos son frescos por 30 segundos,
    // pero se pueden servir datos stale mientras se revalida en background
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, s-maxage=30',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=30',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

