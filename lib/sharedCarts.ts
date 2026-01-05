import { SharedCart } from '@/types/cart';
import fs from 'fs';
import path from 'path';

// Almacenamiento en memoria para producción (Vercel/serverless)
// En desarrollo local, también intenta usar el sistema de archivos
const inMemoryCarts = new Map<string, SharedCart>();

const sharedCartsFilePath = path.join(process.cwd(), 'data', 'shared-carts.json');

function isReadOnlyFileSystem(): boolean {
  // En Vercel/serverless, el sistema de archivos es de solo lectura
  // Detectar Vercel o cualquier entorno serverless
  try {
    if (typeof process !== 'undefined') {
      // Vercel establece esta variable de entorno
      if (process.env.VERCEL || process.env.VERCEL_ENV) {
        return true;
      }
      // También verificar si estamos en producción y no en desarrollo local
      if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_FRONTEND_URL?.includes('localhost')) {
        // En producción, asumir que es serverless (solo lectura)
        return true;
      }
    }
    // En desarrollo local, intentar escribir un archivo temporal para verificar
    const testPath = path.join(process.cwd(), 'data', '.test-write');
    try {
      fs.writeFileSync(testPath, 'test');
      fs.unlinkSync(testPath);
      return false;
    } catch {
      return true;
    }
  } catch {
    return true;
  }
}

const isReadOnly = isReadOnlyFileSystem();

export function getSharedCarts(): SharedCart[] {
  if (isReadOnly) {
    // Usar almacenamiento en memoria
    return Array.from(inMemoryCarts.values());
  }
  
  // Intentar leer del sistema de archivos
  try {
    if (fs.existsSync(sharedCartsFilePath)) {
      const fileContents = fs.readFileSync(sharedCartsFilePath, 'utf8');
      return JSON.parse(fileContents);
    }
  } catch (error) {
    console.error('Error reading shared carts file:', error);
  }
  return [];
}

export function getSharedCartById(id: string): SharedCart | null {
  if (isReadOnly) {
    // Usar almacenamiento en memoria
    return inMemoryCarts.get(id) || null;
  }
  
  const carts = getSharedCarts();
  return carts.find(cart => cart.id === id) || null;
}

export function saveSharedCart(cart: SharedCart): void {
  if (isReadOnly) {
    // Usar almacenamiento en memoria
    inMemoryCarts.set(cart.id, cart);
    
    // Limpiar carritos expirados periódicamente
    const now = new Date();
    inMemoryCarts.forEach((storedCart, id) => {
      if (storedCart.expiresAt && new Date(storedCart.expiresAt) < now) {
        inMemoryCarts.delete(id);
      }
    });
    return;
  }
  
  // Intentar guardar en el sistema de archivos
  try {
    const carts = getSharedCarts();
    carts.push(cart);
    const dir = path.dirname(sharedCartsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(sharedCartsFilePath, JSON.stringify(carts, null, 2));
  } catch (error) {
    console.error('Error writing shared carts file, falling back to memory:', error);
    // Fallback a memoria si falla la escritura
    inMemoryCarts.set(cart.id, cart);
  }
}

export function generateCartId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

