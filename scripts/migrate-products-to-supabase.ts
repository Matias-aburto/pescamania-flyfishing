/**
 * Script para migrar productos del archivo JSON a Supabase
 * Ejecutar: npx ts-node scripts/migrate-products-to-supabase.ts
 * 
 * Requisitos:
 * - Variables de entorno configuradas (.env.local):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY
 */

import { getSupabaseAdmin } from '../lib/supabase';
import { Product } from '../types/product';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'products.json');

// Convertir Product al formato de Supabase
function toSupabaseRow(product: Product): any {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || null,
    price: product.price,
    image: product.image,
    category: product.category,
    tags: product.tags || [],
    variants: product.variants || [],
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
}

async function migrateProducts() {
  // Verificar que Supabase esté configurado
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL no está configurado');
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SECRET_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY no está configurado');
    process.exit(1);
  }

  // Leer productos del archivo JSON
  if (!fs.existsSync(dataFilePath)) {
    console.error(`❌ No se encontró el archivo: ${dataFilePath}`);
    process.exit(1);
  }

  const fileContents = fs.readFileSync(dataFilePath, 'utf8');
  const products: Product[] = JSON.parse(fileContents);

  console.log(`📦 Encontrados ${products.length} productos en el archivo JSON`);

  // Conectar a Supabase
  const supabase = getSupabaseAdmin();

  // Verificar qué productos ya existen
  console.log('🔍 Verificando productos existentes en Supabase...');
  const { data: existingProducts, error: fetchError } = await supabase
    .from('products')
    .select('id');

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('❌ Error al verificar productos existentes:', fetchError);
    process.exit(1);
  }

  const existingIds = new Set((existingProducts || []).map((p: any) => p.id));
  console.log(`✅ Encontrados ${existingIds.size} productos ya existentes en Supabase`);

  // Filtrar productos que no existen
  const productsToInsert = products
    .filter(p => !existingIds.has(p.id))
    .map(toSupabaseRow);

  if (productsToInsert.length === 0) {
    console.log('✅ Todos los productos ya están migrados a Supabase');
    return;
  }

  console.log(`📤 Migrando ${productsToInsert.length} productos nuevos a Supabase...`);

  // Insertar productos en lotes de 100 para evitar límites
  const batchSize = 100;
  let migrated = 0;

  for (let i = 0; i < productsToInsert.length; i += batchSize) {
    const batch = productsToInsert.slice(i, i + batchSize);
    const { error } = await supabase
      .from('products')
      .insert(batch);

    if (error) {
      console.error(`❌ Error al insertar lote ${Math.floor(i / batchSize) + 1}:`, error);
      console.error('Productos fallidos:', batch.map(p => p.id).join(', '));
    } else {
      migrated += batch.length;
      console.log(`✅ Migrados ${migrated}/${productsToInsert.length} productos...`);
    }
  }

  console.log(`\n✅ Migración completada: ${migrated} productos migrados exitosamente`);
  console.log(`📊 Total de productos en Supabase: ${existingIds.size + migrated}`);
}

migrateProducts().catch(console.error);

