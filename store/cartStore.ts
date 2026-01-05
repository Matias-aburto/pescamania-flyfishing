import { create } from 'zustand';
import { CartItem, Product, ProductVariant } from '@/types/product';

// Función para sincronizar productos del carrito con datos actuales
async function syncCartProducts(items: CartItem[]): Promise<CartItem[]> {
  try {
    // Obtener todos los productos actuales
    const response = await fetch('/api/products?t=' + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    const allProducts: Product[] = await response.json();
    
    // Crear un mapa de productos actualizados por ID
    const productsMap = new Map<string, Product>();
    allProducts.forEach(p => productsMap.set(p.id, p));
    
    // Actualizar productos en el carrito con datos frescos
    return items.map(item => {
      const updatedProduct = productsMap.get(item.product.id);
      if (updatedProduct) {
        return {
          ...item,
          product: updatedProduct, // Reemplazar con producto actualizado
        };
      }
      return item; // Si no se encuentra, mantener el original
    });
  } catch (error) {
    console.error('Error syncing cart products:', error);
    return items; // En caso de error, retornar items originales
  }
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  deliveryType: 'retiro' | 'envio' | null;
  comuna: string;
  customerName: string;
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeItem: (itemId: string) => void; // Cambiado para usar itemId único
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryType: (type: 'retiro' | 'envio' | null) => void;
  setComuna: (comuna: string) => void;
  setCustomerName: (name: string) => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemId: (product: Product, variant?: ProductVariant) => string; // Helper para generar ID único
  syncProducts: () => Promise<void>; // Sincronizar productos del carrito
}

const loadCartFromStorage = () => {
  if (typeof window === 'undefined') return { items: [], deliveryType: null, comuna: '', customerName: '' }
  try {
    const stored = localStorage.getItem('pescamania-fly-cart')
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        items: parsed.items || parsed || [],
        deliveryType: parsed.deliveryType || null,
        comuna: parsed.comuna || '',
        customerName: parsed.customerName || '',
      }
    }
  } catch (e) {}
  return { items: [], deliveryType: null, comuna: '', customerName: '' }
}

const saveCartToStorage = (items: CartItem[], deliveryType: 'retiro' | 'envio' | null, comuna: string, customerName: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pescamania-fly-cart', JSON.stringify({ items, deliveryType, comuna, customerName }))
  }
}

export const useCartStore = create<CartStore>((set, get) => {
  const initial = loadCartFromStorage()
  return {
    items: initial.items,
    isOpen: false,
    deliveryType: initial.deliveryType,
    comuna: initial.comuna,
    customerName: initial.customerName,
    getItemId: (product, variant) => {
      return variant ? `${product.id}-${variant.id}` : product.id;
    },
    addItem: (product, quantity = 1, variant) => {
      const items = get().items;
      const itemId = get().getItemId(product, variant);
      const existingItem = items.find(item => get().getItemId(item.product, item.variant) === itemId);
      
      let newItems: CartItem[];
      if (existingItem) {
        newItems = items.map(item => {
          const currentItemId = get().getItemId(item.product, item.variant);
          return currentItemId === itemId
            ? { ...item, quantity: item.quantity + quantity }
            : item;
        });
      } else {
        newItems = [...items, { product, variant, quantity }];
      }
      
      set({ items: newItems });
      saveCartToStorage(newItems, get().deliveryType, get().comuna, get().customerName);
    },
    removeItem: (itemId) => {
      const newItems = get().items.filter(item => 
        get().getItemId(item.product, item.variant) !== itemId
      );
      set({ items: newItems });
      saveCartToStorage(newItems, get().deliveryType, get().comuna, get().customerName);
    },
    updateQuantity: (itemId, quantity) => {
      if (quantity <= 0) {
        get().removeItem(itemId);
      } else {
        const newItems = get().items.map(item => {
          const currentItemId = get().getItemId(item.product, item.variant);
          return currentItemId === itemId ? { ...item, quantity } : item;
        });
        set({ items: newItems });
        saveCartToStorage(newItems, get().deliveryType, get().comuna, get().customerName);
      }
    },
    setDeliveryType: (type) => {
      set({ deliveryType: type });
      if (type !== 'envio') {
        set({ comuna: '' });
      }
      saveCartToStorage(get().items, type, type === 'envio' ? get().comuna : '', get().customerName);
    },
    setComuna: (comuna) => {
      set({ comuna });
      saveCartToStorage(get().items, get().deliveryType, comuna, get().customerName);
    },
    setCustomerName: (name) => {
      set({ customerName: name });
      saveCartToStorage(get().items, get().deliveryType, get().comuna, name);
    },
    clearCart: () => {
      set({ items: [], deliveryType: null, comuna: '', customerName: '' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pescamania-fly-cart');
      }
    },
    toggleCart: () => set(state => ({ isOpen: !state.isOpen })),
    openCart: () => set({ isOpen: true }),
    closeCart: () => set({ isOpen: false }),
    getTotalItems: () => {
      return get().items.reduce((total, item) => total + item.quantity, 0);
    },
    getTotalPrice: () => {
      return get().items.reduce((total, item) => {
        const price = item.variant?.price ?? item.product.price;
        return total + (price * item.quantity);
      }, 0);
    },
    syncProducts: async () => {
      const currentItems = get().items;
      if (currentItems.length === 0) return;
      
      const syncedItems = await syncCartProducts(currentItems);
      set({ items: syncedItems });
      saveCartToStorage(syncedItems, get().deliveryType, get().comuna, get().customerName);
    },
  };
});

