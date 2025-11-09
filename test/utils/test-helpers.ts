import { DataSource } from 'typeorm';
import { hash } from 'argon2';
import { faker } from '@faker-js/faker';
import { testAddresses } from '../fixtures/users.fixture';

/**
 * Create test user in database
 */
export async function createTestUser(
  dataSource: DataSource,
  userData: {
    email: string;
    password: string;
    locale?: string;
    currency?: string;
    role?: string;
  }
) {
  const hashedPassword = await hash(userData.password);

  const result = await dataSource.query(
    `INSERT INTO users (email, password_hash, locale, currency, is_verified, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, locale, currency, role, created_at`,
    [
      userData.email,
      hashedPassword,
      userData.locale || 'en',
      userData.currency || 'USD',
      true,
      userData.role || 'user',
    ]
  );

  return result[0];
}

/**
 * Create test merchant in database
 */
export async function createTestMerchant(
  dataSource: DataSource,
  userId: string,
  merchantData?: {
    business_name?: string;
    business_type?: string;
    country?: string;
  }
) {
  const result = await dataSource.query(
    `INSERT INTO merchants (user_id, business_name, business_type, country, is_verified, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, business_name, status`,
    [
      userId,
      merchantData?.business_name || faker.company.name(),
      merchantData?.business_type || 'individual',
      merchantData?.country || 'US',
      true,
      'active',
    ]
  );

  return result[0];
}

/**
 * Create test product in database
 */
export async function createTestProduct(
  dataSource: DataSource,
  merchantId: string,
  productData: {
    name: string;
    description?: string;
    type: string;
    price: number;
    currency: string;
    sku: string;
    stock_quantity?: number;
    is_active?: boolean;
  }
) {
  const result = await dataSource.query(
    `INSERT INTO products (merchant_id, name, description, type, price, currency, sku, stock_quantity, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, merchant_id, name, type, price, currency, sku, stock_quantity`,
    [
      merchantId,
      productData.name,
      productData.description || '',
      productData.type,
      productData.price,
      productData.currency,
      productData.sku,
      productData.stock_quantity ?? 100,
      productData.is_active ?? true,
    ]
  );

  return result[0];
}

/**
 * Create test checkout session in database
 */
export async function createTestCheckoutSession(
  dataSource: DataSource,
  userId: string,
  sessionData: {
    currency: string;
    cart_snapshot: any[];
    totals: any;
    shipping_address?: any;
    billing_address?: any;
  }
) {
  const result = await dataSource.query(
    `INSERT INTO checkout_sessions (user_id, currency, cart_snapshot, totals, shipping_address, billing_address, status, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, user_id, currency, status, totals`,
    [
      userId,
      sessionData.currency,
      JSON.stringify(sessionData.cart_snapshot),
      JSON.stringify(sessionData.totals),
      sessionData.shipping_address ? JSON.stringify(sessionData.shipping_address) : null,
      sessionData.billing_address ? JSON.stringify(sessionData.billing_address) : null,
      'in_progress',
      new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    ]
  );

  return result[0];
}

/**
 * Create test order in database
 */
export async function createTestOrder(
  dataSource: DataSource,
  userId: string,
  orderData: {
    order_number?: string;
    status?: string;
    payment_status?: string;
    currency: string;
    total_amount: number;
    shipping_address?: any;
  }
) {
  const orderNumber = orderData.order_number || `TEST-${Date.now()}`;

  const result = await dataSource.query(
    `INSERT INTO orders (
      order_number, user_id, status, payment_status, currency,
      subtotal, tax_amount, shipping_amount, discount_amount, total_amount,
      shipping_address, billing_address
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id, order_number, user_id, status, payment_status, total_amount`,
    [
      orderNumber,
      userId,
      orderData.status || 'pending',
      orderData.payment_status || 'pending',
      orderData.currency,
      orderData.total_amount,
      0,
      0,
      0,
      orderData.total_amount,
      orderData.shipping_address ? JSON.stringify(orderData.shipping_address) : JSON.stringify(testAddresses.usAddress),
      orderData.shipping_address ? JSON.stringify(orderData.shipping_address) : JSON.stringify(testAddresses.usAddress),
    ]
  );

  return result[0];
}

/**
 * Create test order line item in database
 */
export async function createTestLineItem(
  dataSource: DataSource,
  orderId: string,
  merchantId: string,
  productId: string,
  lineItemData: {
    type: string;
    status?: string;
    quantity: number;
    unit_price: number;
    product_name: string;
    product_sku: string;
  }
) {
  const result = await dataSource.query(
    `INSERT INTO order_line_items (
      order_id, merchant_id, product_id, type, status,
      product_name, product_sku, quantity, unit_price, total_price, currency
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id, order_id, type, status, quantity, unit_price, total_price`,
    [
      orderId,
      merchantId,
      productId,
      lineItemData.type,
      lineItemData.status || 'pending',
      lineItemData.product_name,
      lineItemData.product_sku,
      lineItemData.quantity,
      lineItemData.unit_price,
      lineItemData.quantity * lineItemData.unit_price,
      'USD',
    ]
  );

  return result[0];
}

/**
 * Create JWT token for testing
 */
export function createTestToken(userId: string): string {
  // In real tests, this would use the actual JWT service
  // For now, return a mock token
  return `Bearer test_token_${userId}`;
}

/**
 * Wait for async operations
 */
export async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random test email
 */
export function generateTestEmail(): string {
  return `test-${faker.string.uuid()}@test.com`;
}

/**
 * Generate random test SKU
 */
export function generateTestSKU(): string {
  return `TEST-${faker.string.alphanumeric(8).toUpperCase()}`;
}
