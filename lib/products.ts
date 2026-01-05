import { Product } from '@/types/product';
import { generateSlug, generateUniqueSlug } from '@/lib/slug';
import { getSupabaseAdmin } from './supabase';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'products.json');

// Fallback: almacenamiento en memoria para cuando Supabase no está configurado
const inMemoryProducts = new Map<string, Product>();

// Verificar si Supabase está configurado
function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

// Convertir datos de Supabase al formato Product
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

export async function getProducts(): Promise<Product[]> {
  // Prioridad 1: Supabase (si está configurado)
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Si la tabla no existe (PGRST205), es esperado antes de ejecutar migraciones
        // Solo mostrar error si no es este caso específico
        if (error.code !== 'PGRST205') {
          console.error('Error fetching products from Supabase:', error);
        }
        // Fallback a sistema de archivos o memoria
      } else if (data) {
        return data.map(fromSupabaseRow);
      }
    } catch (error) {
      // Solo mostrar error si no es un error de tabla no encontrada
      if (error instanceof Error && !error.message.includes('Could not find the table')) {
        console.error('Error connecting to Supabase:', error);
      }
      // Fallback a sistema de archivos
    }
  }

  // Fallback 2: Sistema de archivos (solo en desarrollo local)
  try {
    if (fs.existsSync(dataFilePath)) {
      const fileContents = fs.readFileSync(dataFilePath, 'utf8');
      const products: Product[] = JSON.parse(fileContents);
      
      // Migración automática: agregar slugs a productos que no los tienen
      let needsSlugMigration = false
      const migratedProducts = products.map(product => {
        if (!product.slug) {
          needsSlugMigration = true
          const baseSlug = generateSlug(product.name)
          const existingSlugs = products
            .filter(p => p.id !== product.id && p.slug)
            .map(p => p.slug!)
          const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs)
          return { ...product, slug: uniqueSlug }
        }
        return product
      })
      
      // Guardar slugs si fue necesario
      if (needsSlugMigration) {
        saveProductsToFile(migratedProducts);
      }
      
      // Intentar migrar a Supabase si está configurado (siempre, no solo cuando hay cambios de slugs)
      if (isSupabaseConfigured()) {
        migrateProductsToSupabase(migratedProducts).catch(console.error);
      }
      
      return migratedProducts
    }
  } catch (error) {
    console.error('Error reading products file:', error);
  }

  // Fallback 3: Memoria
  return Array.from(inMemoryProducts.values());
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  // Prioridad 1: Supabase (si está configurado)
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        // Si la tabla no existe (PGRST205), es esperado antes de ejecutar migraciones
        if (error.code !== 'PGRST205') {
          console.error('Error fetching product from Supabase:', error);
        }
        // Fallback
      } else if (data) {
        return fromSupabaseRow(data);
      }
    } catch (error) {
      console.error('Error connecting to Supabase:', error);
      // Fallback
    }
  }

  // Fallback: buscar en archivos o memoria
  const products = await getProducts();
  return products.find(p => p.slug === slug) || null;
}

// Función auxiliar para guardar productos en archivo
function saveProductsToFile(products: Product[]): void {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('Error writing products file:', error);
  }
}

// Función para migrar productos del archivo a Supabase
async function migrateProductsToSupabase(products: Product[]): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = getSupabaseAdmin();
    
    // Verificar qué productos ya existen
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id');

    const existingIds = new Set((existingProducts || []).map((p: any) => p.id));
    
    // Insertar solo productos que no existen
    const productsToInsert = products
      .filter(p => !existingIds.has(p.id))
      .map(toSupabaseRow);

    if (productsToInsert.length > 0) {
      const { error } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (error) {
        // Si la tabla no existe (PGRST205), es esperado antes de ejecutar migraciones
        if (error.code !== 'PGRST205') {
          console.error('Error migrating products to Supabase:', error);
        }
      } else {
        console.log(`Migrated ${productsToInsert.length} products to Supabase`);
      }
    }
  } catch (error) {
    console.error('Error migrating products to Supabase:', error);
  }
}

export async function createProduct(product: Omit<Product, 'id' | 'slug' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const products = await getProducts();
  const baseSlug = generateSlug(product.name);
  const existingSlugs = products.map(p => p.slug);
  const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);
  
  const newProduct: Product = {
    ...product,
    slug: uniqueSlug,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Prioridad 1: Supabase (si está configurado)
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from('products')
        .insert(toSupabaseRow(newProduct));

      if (error) {
        console.error('Error creating product in Supabase:', error);
        throw new Error('Failed to create product in database');
      }
      return newProduct;
    } catch (error) {
      console.error('Supabase operation failed:', error);
      throw error;
    }
  }

  // Fallback: Sistema de archivos
  products.push(newProduct);
  saveProductsToFile(products);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const products = await getProducts();
  const existingProduct = products.find(p => p.id === id);
  if (!existingProduct) return null;

  // Si se actualiza el nombre, regenerar el slug
  if (updates.name && updates.name !== existingProduct.name) {
    const baseSlug = generateSlug(updates.name);
    const existingSlugs = products.filter(p => p.id !== id).map(p => p.slug);
    updates.slug = generateUniqueSlug(baseSlug, existingSlugs);
  }

  const updatedProduct: Product = {
    ...existingProduct,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Prioridad 1: Supabase (si está configurado)
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from('products')
        .update(toSupabaseRow(updatedProduct))
        .eq('id', id);

      if (error) {
        console.error('Error updating product in Supabase:', error);
        throw new Error('Failed to update product in database');
      }
      return updatedProduct;
    } catch (error) {
      console.error('Supabase operation failed:', error);
      throw error;
    }
  }

  // Fallback: Sistema de archivos
  const index = products.findIndex(p => p.id === id);
  products[index] = updatedProduct;
  saveProductsToFile(products);
  return updatedProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  // Prioridad 1: Supabase (si está configurado)
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product from Supabase:', error);
        throw new Error('Failed to delete product from database');
      }
      return true;
    } catch (error) {
      console.error('Supabase operation failed:', error);
      throw error;
    }
  }

  // Fallback: Sistema de archivos
  const products = await getProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;
  saveProductsToFile(filtered);
  return true;
}

export async function getCategories(): Promise<string[]> {
  // Prioridad 1: Supabase (si está configurado)
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('products')
        .select('category');

      if (!error && data) {
        const categories = new Set(data.map((row: any) => row.category));
        return Array.from(categories).sort() as string[];
      } else if (error && error.code === 'PGRST205') {
        // Tabla no existe, es esperado antes de ejecutar migraciones
        // Fallback silencioso
      } else if (error) {
        console.error('Error fetching categories from Supabase:', error);
      }
    } catch (error) {
      // Solo mostrar error si no es un error de tabla no encontrada
      if (error instanceof Error && !error.message.includes('Could not find the table')) {
        console.error('Error fetching categories from Supabase:', error);
      }
      // Fallback
    }
  }

  // Fallback: Sistema de archivos o memoria
  const products = await getProducts();
  const categories = new Set(products.map(p => p.category));
  return Array.from(categories).sort();
}

