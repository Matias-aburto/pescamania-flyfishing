/**
 * Script para verificar el estado de los productos en Supabase
 * Ejecutar: npx tsx scripts/check-products-supabase.ts
 * 
 * Requisitos:
 * - Variables de entorno configuradas (.env.local):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY
 */

// Cargar variables de entorno desde .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { getSupabaseAdmin } from '../lib/supabase';

async function checkProducts() {
  // Verificar que Supabase esté configurado
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL no está configurado');
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SECRET_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY no está configurado');
    process.exit(1);
  }

  console.log('🔍 Verificando conexión con Supabase...');
  console.log(`📍 URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);

  const supabase = getSupabaseAdmin();

  // Verificar si la tabla existe
  console.log('\n📊 Verificando tabla "products"...');
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, category, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    if (error.code === 'PGRST205') {
      console.error('❌ La tabla "products" no existe en Supabase.');
      console.log('💡 Ejecuta la migración: supabase/migrations/005_products.sql');
      process.exit(1);
    }
    console.error('❌ Error al consultar productos:', error);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('⚠️  No hay productos en Supabase');
    console.log('💡 Ejecuta el script de migración: npx tsx scripts/migrate-products-to-supabase.ts');
    return;
  }

  console.log(`✅ Encontrados ${products.length} productos (mostrando primeros 10):\n`);
  
  products.forEach((product: any, index: number) => {
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   Slug: ${product.slug}`);
    console.log(`   Categoría: ${product.category}`);
    console.log(`   Creado: ${new Date(product.created_at).toLocaleDateString()}`);
    console.log('');
  });

  // Contar total
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total de productos en Supabase: ${count || 0}`);
}

checkProducts().catch(console.error);

