import { NextResponse } from 'next/server'
import { PRODUCT_CATEGORIES } from '@/lib/constants'

export async function GET() {
  try {
    // Retornar las categorías predefinidas
    return NextResponse.json(Array.from(PRODUCT_CATEGORIES))
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}

