import { NextResponse } from 'next/server'
import { getTags } from '@/lib/products'

export async function GET() {
  try {
    const tags = getTags()
    return NextResponse.json(tags)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener etiquetas' },
      { status: 500 }
    )
  }
}

