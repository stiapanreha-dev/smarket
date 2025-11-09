import { CheckoutStatus } from '../../src/database/entities/checkout-session.entity';

/**
 * Test checkout session fixtures
 */
export const testCheckoutSessions = {
  activeSession: {
    status: CheckoutStatus.IN_PROGRESS,
    currency: 'USD',
    totals: {
      subtotal: 2999,
      tax_amount: 300,
      shipping_amount: 500,
      discount_amount: 0,
      total_amount: 3799,
      currency: 'USD',
    },
    cart_snapshot: [
      {
        productId: 'product-1',
        merchantId: 'merchant-1',
        productName: 'Test Physical Product',
        sku: 'TEST-PHYS-001',
        type: 'physical',
        quantity: 1,
        price: 2999,
        currency: 'USD',
      },
    ],
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    is_expired: false,
  },
  expiredSession: {
    status: CheckoutStatus.EXPIRED,
    currency: 'USD',
    totals: {
      subtotal: 2999,
      tax_amount: 300,
      shipping_amount: 500,
      discount_amount: 0,
      total_amount: 3799,
      currency: 'USD',
    },
    cart_snapshot: [],
    expires_at: new Date(Date.now() - 1000), // Expired
    is_expired: true,
  },
  completedSession: {
    status: CheckoutStatus.COMPLETED,
    currency: 'USD',
    totals: {
      subtotal: 2999,
      tax_amount: 300,
      shipping_amount: 500,
      discount_amount: 0,
      total_amount: 3799,
      currency: 'USD',
    },
    cart_snapshot: [],
    completed_at: new Date(),
    is_expired: false,
  },
  multipleItemsSession: {
    status: CheckoutStatus.IN_PROGRESS,
    currency: 'USD',
    totals: {
      subtotal: 8997,
      tax_amount: 900,
      shipping_amount: 500,
      discount_amount: 500,
      total_amount: 9897,
      currency: 'USD',
    },
    cart_snapshot: [
      {
        productId: 'product-1',
        merchantId: 'merchant-1',
        productName: 'Test Physical Product',
        sku: 'TEST-PHYS-001',
        type: 'physical',
        quantity: 2,
        price: 2999,
        currency: 'USD',
      },
      {
        productId: 'product-2',
        merchantId: 'merchant-1',
        productName: 'Test Digital Product',
        sku: 'TEST-DIGI-001',
        type: 'digital',
        quantity: 1,
        price: 999,
        currency: 'USD',
      },
      {
        productId: 'product-3',
        merchantId: 'merchant-2',
        productName: 'Test Service',
        sku: 'TEST-SERV-001',
        type: 'service',
        quantity: 1,
        price: 5000,
        currency: 'USD',
      },
    ],
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    is_expired: false,
  },
};
