import { NextResponse } from 'next/server'
import { getSharedCartById } from '@/lib/sharedCarts'
import { getSupabaseAdmin } from '@/lib/supabase'

// Carritos compartidos pueden cachearse brevemente (5 segundos)
// ya que los cambios no son tan frecuentes
export const revalidate = 5

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
    // Solo obtener los productos que están en el carrito (no todos)
    const productIds = cart.items.map(item => item.product.id)
    
    if (productIds.length > 0) {
      const supabase = getSupabaseAdmin()
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, slug, description, price, image, category, tags, variants, created_at, updated_at')
        .in('id', productIds)
      
      if (productsData) {
        const productsMap = new Map(
          productsData.map((row: any) => [
            row.id,
            {
              id: row.id,
              name: row.name,
              slug: row.slug,
              description: row.description || '',
              price: row.price,
              image: row.image,
              category: row.category,
              tags: row.tags || [],
              variants: row.variants || [],
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            }
          ])
        )
        
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
        
        // Cache corta para carritos compartidos
        return NextResponse.json(syncedCart, {
          headers: {
            'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=60',
            'CDN-Cache-Control': 'public, s-maxage=5',
            'Vercel-CDN-Cache-Control': 'public, s-maxage=5',
          },
        })
      }
    }
    
    // Si no hay productos o falla la sincronización, retornar carrito original
    const syncedCart = cart
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener el carrito' },
      { status: 500 }
    )
  }
}

