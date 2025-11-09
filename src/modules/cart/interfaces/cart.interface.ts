import { CartItem } from './cart-item.interface';

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  merchantCount: number;
  itemsByMerchant: Record<string, CartItem[]>;
}
