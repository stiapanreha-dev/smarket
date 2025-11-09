import { OrderStatus, PaymentStatus } from '../../src/database/entities/order.entity';

/**
 * Test order fixtures
 */
export const testOrders = {
  pendingOrder: {
    order_number: 'TEST-ORD-001',
    status: OrderStatus.PENDING,
    payment_status: PaymentStatus.PENDING,
    currency: 'USD',
    subtotal: 2999,
    tax_amount: 300,
    shipping_amount: 500,
    discount_amount: 0,
    total_amount: 3799,
  },
  confirmedOrder: {
    order_number: 'TEST-ORD-002',
    status: OrderStatus.CONFIRMED,
    payment_status: PaymentStatus.CAPTURED,
    currency: 'USD',
    subtotal: 2999,
    tax_amount: 300,
    shipping_amount: 500,
    discount_amount: 0,
    total_amount: 3799,
  },
  processingOrder: {
    order_number: 'TEST-ORD-003',
    status: OrderStatus.PROCESSING,
    payment_status: PaymentStatus.CAPTURED,
    currency: 'USD',
    subtotal: 2999,
    tax_amount: 300,
    shipping_amount: 500,
    discount_amount: 0,
    total_amount: 3799,
  },
  completedOrder: {
    order_number: 'TEST-ORD-004',
    status: OrderStatus.COMPLETED,
    payment_status: PaymentStatus.CAPTURED,
    currency: 'USD',
    subtotal: 2999,
    tax_amount: 300,
    shipping_amount: 500,
    discount_amount: 0,
    total_amount: 3799,
  },
  cancelledOrder: {
    order_number: 'TEST-ORD-005',
    status: OrderStatus.CANCELLED,
    payment_status: PaymentStatus.REFUNDED,
    currency: 'USD',
    subtotal: 2999,
    tax_amount: 300,
    shipping_amount: 500,
    discount_amount: 0,
    total_amount: 3799,
  },
};

/**
 * Test line item fixtures
 */
export const testLineItems = {
  physicalLineItem: {
    type: 'physical',
    status: 'pending',
    product_name: 'Test Physical Product',
    product_sku: 'TEST-PHYS-001',
    quantity: 2,
    unit_price: 2999,
    total_price: 5998,
    currency: 'USD',
  },
  digitalLineItem: {
    type: 'digital',
    status: 'pending',
    product_name: 'Test Digital Product',
    product_sku: 'TEST-DIGI-001',
    quantity: 1,
    unit_price: 999,
    total_price: 999,
    currency: 'USD',
  },
  serviceLineItem: {
    type: 'service',
    status: 'pending',
    product_name: 'Test Service',
    product_sku: 'TEST-SERV-001',
    quantity: 1,
    unit_price: 5000,
    total_price: 5000,
    currency: 'USD',
  },
};
