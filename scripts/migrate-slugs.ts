/**
 * Script de migración para agregar slugs a productos existentes
 * Ejecutar: npx ts-node scripts/migrate-slugs.ts
 * 
 * NOTA: La migración de slugs ahora se hace automáticamente en getProducts()
 * Este script se mantiene por compatibilidad pero ya no es necesario ejecutarlo
 */

import { getProducts, updateProduct } from '../lib/products'
import { generateSlug, generateUniqueSlug } from '../lib/slug'

async function migrateSlugs() {
  const products = await getProducts()
  let migratedCount = 0

  for (const product of products) {
    // Si ya tiene slug, mantenerlo
    if (product.slug) {
      continue
    }
    
    // Generar slug único
    const baseSlug = generateSlug(product.name)
    const existingSlugs = products
      .filter(p => p.id !== product.id && p.slug)
      .map(p => p.slug!)
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs)
    
    // Actualizar producto con el nuevo slug
    await updateProduct(product.id, { slug: uniqueSlug })
    migratedCount++
  }

  console.log(`Migrados ${migratedCount} productos con slugs`)
}

migrateSlugs().catch(console.error)

