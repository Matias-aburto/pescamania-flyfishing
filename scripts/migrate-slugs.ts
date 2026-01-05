/**
 * Script de migración para agregar slugs a productos existentes
 * Ejecutar: npx ts-node scripts/migrate-slugs.ts
 */

import { getProducts, saveProducts } from '../lib/products'
import { generateSlug, generateUniqueSlug } from '../lib/slug'

const products = getProducts()
const updatedProducts = products.map(product => {
  // Si ya tiene slug, mantenerlo
  if (product.slug) {
    return product
  }
  
  // Generar slug único
  const baseSlug = generateSlug(product.name)
  const existingSlugs = products
    .filter(p => p.id !== product.id && p.slug)
    .map(p => p.slug!)
  const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs)
  
  return {
    ...product,
    slug: uniqueSlug
  }
})

saveProducts(updatedProducts)
console.log(`Migrados ${updatedProducts.length} productos con slugs`)

