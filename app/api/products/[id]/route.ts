import { NextResponse } from 'next/server'
import { getProductById } from '@/lib/products'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = getProductById(params.id)
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    )
  }
}

