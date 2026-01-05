import { NextResponse } from 'next/server'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/products'
import { Product } from '@/types/product'

export async function GET() {
  try {
    const products = await getProducts()
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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const product = await createProduct(body)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    console.log('[API PUT /api/admin/products] Actualizando producto:', { id, updates })
    const product = await updateProduct(id, updates)
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }
    console.log('[API PUT /api/admin/products] Producto actualizado, retornando:', {
      id: product.id,
      image: product.image,
      updatedAt: product.updatedAt,
    })
    return NextResponse.json(product, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('[API PUT /api/admin/products] Error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { error: 'ID de producto requerido' },
        { status: 400 }
      )
    }
    const deleted = await deleteProduct(id)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    )
  }
}

