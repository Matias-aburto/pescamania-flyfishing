import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/products'

export async function GET() {
  try {
    const products = await getProducts()
    // Log para diagnóstico - mostrar updatedAt de los primeros productos
    if (products.length > 0) {
      console.log('[API GET /api/products] Productos obtenidos:', products.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        image: p.image,
        updatedAt: p.updatedAt,
        updatedAtTimestamp: new Date(p.updatedAt).getTime(),
      })))
    }
    // Agregar headers para evitar caché
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

