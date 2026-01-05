import { NextResponse } from 'next/server'
import { saveSharedCart, generateCartId } from '@/lib/sharedCarts'
import { CartItem } from '@/types/product'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const items: CartItem[] = body.items || []
    const deliveryType = body.deliveryType || null
    const comuna = body.comuna || ''
    const customerName = body.customerName || ''

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'El carrito está vacío' },
        { status: 400 }
      )
    }

    const cartId = generateCartId()
    const sharedCart = {
      id: cartId,
      items: items,
      deliveryType: deliveryType,
      comuna: deliveryType === 'envio' ? comuna : undefined,
      customerName: customerName || undefined,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
    }

    await saveSharedCart(sharedCart)

    // Obtener la URL base del frontend desde variable de entorno o del request
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL
    
    let baseUrl: string
    if (frontendUrl) {
      // Usar la variable de entorno si está configurada
      baseUrl = frontendUrl.replace(/\/$/, '') // Remover trailing slash si existe
    } else {
      // Fallback: usar la URL del request (para desarrollo local)
      const requestUrl = new URL(request.url)
      baseUrl = `${requestUrl.protocol}//${requestUrl.host}`
    }
    
    return NextResponse.json({ 
      id: cartId,
      url: `${baseUrl}/cart/${cartId}`
    })
  } catch (error) {
    console.error('Error al compartir carrito:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { 
        error: 'Error al compartir el carrito',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

