export interface ProductVariant {
  id: string;
  name: string;
  color: string; // Color en formato hex (ej: #FF0000) o nombre
  image: string;
  price?: number; // Precio opcional para esta variante (si no tiene, usa el precio del producto)
}

export interface Product {
  id: string;
  name: string;
  slug: string; // Slug amigable para URLs
  description?: string;
  price: number;
  image: string;
  category: string;
  tags: string[];
  variants?: ProductVariant[]; // Variantes opcionales
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant; // Variante seleccionada (opcional)
  quantity: number;
}

export interface FilterOptions {
  category: string[]; // Cambiado a array para permitir múltiples selecciones
  search: string;
  tags: string[];
}

