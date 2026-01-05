import { SharedCart } from '@/types/cart';
import fs from 'fs';
import path from 'path';

const sharedCartsFilePath = path.join(process.cwd(), 'data', 'shared-carts.json');

export function getSharedCarts(): SharedCart[] {
  try {
    const fileContents = fs.readFileSync(sharedCartsFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    return [];
  }
}

export function getSharedCartById(id: string): SharedCart | null {
  const carts = getSharedCarts();
  return carts.find(cart => cart.id === id) || null;
}

export function saveSharedCart(cart: SharedCart): void {
  const carts = getSharedCarts();
  carts.push(cart);
  const dir = path.dirname(sharedCartsFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(sharedCartsFilePath, JSON.stringify(carts, null, 2));
}

export function generateCartId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

