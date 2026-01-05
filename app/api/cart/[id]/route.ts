import { NextResponse } from 'next/server'
import { getSharedCartById } from '@/lib/sharedCarts'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cart = await getSharedCartById(params.id)
    
    if (!cart) {
      return NextResponse.json(
        { error: 'Carrito no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el carrito ha expirado
    if (cart.expiresAt && new Date(cart.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Este carrito ha expirado' },
        { status: 410 }
      )
    }

    return NextResponse.json(cart)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener el carrito' },
      { status: 500 }
    )
  }
}

