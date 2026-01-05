import { Product } from '@/types/product';
import { generateSlug, generateUniqueSlug } from '@/lib/slug';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'products.json');

export function getProducts(): Product[] {
  try {
    const fileContents = fs.readFileSync(dataFilePath, 'utf8');
    const products: Product[] = JSON.parse(fileContents);
    
    // Migración automática: agregar slugs a productos que no los tienen
    let needsMigration = false
    const migratedProducts = products.map(product => {
      if (!product.slug) {
        needsMigration = true
        const baseSlug = generateSlug(product.name)
        const existingSlugs = products
          .filter(p => p.id !== product.id && p.slug)
          .map(p => p.slug!)
        const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs)
        return { ...product, slug: uniqueSlug }
      }
      return product
    })
    
    if (needsMigration) {
      saveProducts(migratedProducts)
    }
    
    return migratedProducts
  } catch (error) {
    // Si el archivo no existe, retornar array vacío
    return [];
  }
}

export function getProductById(id: string): Product | null {
  const products = getProducts();
  return products.find(p => p.id === id) || null;
}

export function getProductBySlug(slug: string): Product | null {
  const products = getProducts();
  return products.find(p => p.slug === slug) || null;
}

export function saveProducts(products: Product[]): void {
  const dir = path.dirname(dataFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dataFilePath, JSON.stringify(products, null, 2));
}

export function createProduct(product: Omit<Product, 'id' | 'slug' | 'createdAt' | 'updatedAt'>): Product {
  const products = getProducts();
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
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  // Si se actualiza el nombre, regenerar el slug
  if (updates.name && updates.name !== products[index].name) {
    const baseSlug = generateSlug(updates.name);
    const existingSlugs = products.filter((p, i) => i !== index).map(p => p.slug!);
    updates.slug = generateUniqueSlug(baseSlug, existingSlugs);
  }
  
  products[index] = {
    ...products[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveProducts(products);
  return products[index];
}

export function deleteProduct(id: string): boolean {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;
  saveProducts(filtered);
  return true;
}

export function getCategories(): string[] {
  const products = getProducts();
  const categories = new Set(products.map(p => p.category));
  return Array.from(categories).sort();
}

export function getTags(): string[] {
  const products = getProducts();
  const allTags = products.flatMap(p => p.tags);
  return Array.from(new Set(allTags)).sort();
}

