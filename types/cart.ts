import { CartItem } from './product'

export interface SharedCart {
  id: string
  items: CartItem[]
  deliveryType?: 'retiro' | 'envio' | null
  comuna?: string
  customerName?: string
  createdAt: string
  expiresAt?: string
}

