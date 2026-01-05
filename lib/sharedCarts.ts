import { SharedCart } from '@/types/cart';
import { getSupabaseAdmin } from './supabase';
import fs from 'fs';
import path from 'path';

// Fallback: almacenamiento en memoria para cuando Supabase no está configurado
const inMemoryCarts = new Map<string, SharedCart>();
const sharedCartsFilePath = path.join(process.cwd(), 'data', 'shared-carts.json');

// Verificar si Supabase está configurado
function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) // Soporta nueva y legacy
  );
}

// Obtener todos los carritos compartidos
export async function getSharedCarts(): Promise<SharedCart[]> {
  // Prioridad 1: Supabase (si está configurado)
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('shared_carts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching shared carts from Supabase:', error);
        return [];
      }

      // Convertir los datos de Supabase al formato SharedCart
      return (data || []).map((row: any) => ({
        id: row.id,
        items: row.items,
        deliveryType: row.delivery_type,
        comuna: row.comuna,
        customerName: row.customer_name,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
      }));
    } catch (error) {
      console.error('Error connecting to Supabase:', error);
      // Fallback a memoria si Supabase falla
      return Array.from(inMemoryCarts.values());
    }
  }

  // Fallback 2: Sistema de archivos (solo en desarrollo local)
  try {
    if (fs.existsSync(sharedCartsFilePath)) {
      const fileContents = fs.readFileSync(sharedCartsFilePath, 'utf8');
      return JSON.parse(fileContents);
    }
  } catch (error) {
    console.error('Error reading shared carts file:', error);
  }

  // Fallback 3: Memoria
  return Array.from(inMemoryCarts.values());
}

// Obtener un carrito compartido por ID
export async function getSharedCartById(id: string): Promise<SharedCart | null> {
  // Prioridad 1: Supabase (si está configurado)
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('shared_carts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No encontrado
          return null;
        }
        console.error('Error fetching shared cart from Supabase:', error);
        return null;
      }

      if (!data) return null;

      // Verificar si está expirado
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        // Eliminar carrito expirado
        await supabase.from('shared_carts').delete().eq('id', id);
        return null;
      }

      // Convertir al formato SharedCart
      return {
        id: data.id,
        items: data.items,
        deliveryType: data.delivery_type,
        comuna: data.comuna,
        customerName: data.customer_name,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
      };
    } catch (error) {
      console.error('Error connecting to Supabase:', error);
      // Fallback a memoria
      return inMemoryCarts.get(id) || null;
    }
  }

  // Fallback: buscar en memoria o archivos
  const carts = await getSharedCarts();
  return carts.find(cart => cart.id === id) || null;
}

// Guardar un carrito compartido
export async function saveSharedCart(cart: SharedCart): Promise<void> {
  // Prioridad 1: Supabase (si está configurado)
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from('shared_carts')
        .insert({
          id: cart.id,
          items: cart.items,
          delivery_type: cart.deliveryType,
          comuna: cart.comuna,
          customer_name: cart.customerName,
          created_at: cart.createdAt,
          expires_at: cart.expiresAt,
        });

      if (error) {
        console.error('Error saving shared cart to Supabase:', error);
        // Si es un error de duplicado, intentar actualizar en lugar de insertar
        if (error.code === '23505') { // Violación de clave única
          const { error: updateError } = await supabase
            .from('shared_carts')
            .update({
              items: cart.items,
              delivery_type: cart.deliveryType,
              comuna: cart.comuna,
              customer_name: cart.customerName,
              expires_at: cart.expiresAt,
            })
            .eq('id', cart.id);
          
          if (updateError) {
            console.error('Error updating shared cart in Supabase:', updateError);
            throw new Error('Failed to save cart to database');
          }
          return;
        }
        throw new Error('Failed to save cart to database');
      }
      // Éxito: carrito guardado en Supabase (persistente)
      return;
    } catch (error) {
      console.error('Error connecting to Supabase:', error);
      // ⚠️ IMPORTANTE: Si Supabase falla, lanzamos el error en lugar de usar memoria
      // Esto asegura que el usuario sepa que hay un problema y no pierda datos
      throw new Error('No se pudo guardar el carrito. Por favor, intenta nuevamente.');
    }
  }

  // Fallback 2: Sistema de archivos (solo en desarrollo local)
  try {
    const carts = await getSharedCarts();
    carts.push(cart);
    const dir = path.dirname(sharedCartsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(sharedCartsFilePath, JSON.stringify(carts, null, 2));
  } catch (error) {
    console.error('Error writing shared carts file, falling back to memory:', error);
    // Fallback 3: Memoria
    inMemoryCarts.set(cart.id, cart);
  }
}

// Generar un ID único para el carrito
export function generateCartId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

