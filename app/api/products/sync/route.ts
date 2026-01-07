import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Product } from '@/types/product'

// Revalidar cada 30 segundos
export const revalidate = 30

// Convertir datos de Supabase al formato Product (solo campos necesarios)
function fromSupabaseRow(row: any): Product {
  return {
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
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ids } = body
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs de productos requeridos' },
        { status: 400 }
      )
    }
    
    // Obtener solo los productos solicitados desde Supabase
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('products')
      .select('id, name, slug, description, price, image, category, tags, variants, created_at, updated_at')
      .in('id', ids)
    
    if (error) {
      console.error('Error fetching products from Supabase:', error)
      return NextResponse.json(
        { error: 'Error al obtener productos' },
        { status: 500 }
      )
    }
    
    const products = (data || []).map(fromSupabaseRow)
    
    // Cachear con revalidación
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, s-maxage=30',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=30',
        'Content-Encoding': 'gzip', // Next.js comprime automáticamente, pero lo indicamos
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

