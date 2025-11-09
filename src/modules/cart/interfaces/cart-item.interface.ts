export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number; // Price in minor units (cents) at time of adding
  currency: string;
  merchantId: string;
  type: 'physical' | 'digital' | 'service';
  metadata?: {
    bookingDate?: Date;
    bookingSlot?: string;
    customization?: Record<string, any>;
  };
}
