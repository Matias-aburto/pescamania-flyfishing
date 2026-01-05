import { NextResponse } from 'next/server'
import { getSharedCartById } from '@/lib/sharedCarts'
import { getProducts } from '@/lib/products'

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

    // Sincronizar productos del carrito con datos actuales
    const allProducts = await getProducts()
    const productsMap = new Map(allProducts.map(p => [p.id, p]))
    
    // Actualizar productos en el carrito con datos frescos
    const syncedItems = cart.items.map(item => {
      const updatedProduct = productsMap.get(item.product.id)
      if (updatedProduct) {
        return {
          ...item,
          product: updatedProduct, // Reemplazar con producto actualizado
        }
      }
      return item // Si no se encuentra, mantener el original
    })

    const syncedCart = {
      ...cart,
      items: syncedItems,
    }

    // Agregar headers para evitar caché
    return NextResponse.json(syncedCart, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener el carrito' },
      { status: 500 }
    )
  }
}

