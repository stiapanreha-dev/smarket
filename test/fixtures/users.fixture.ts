/**
 * Test user fixtures
 */
export const testUsers = {
  buyer: {
    email: 'buyer@test.com',
    password: 'Test123!@#',
    locale: 'en',
    currency: 'USD',
    role: 'user',
  },
  merchant: {
    email: 'merchant@test.com',
    password: 'Test123!@#',
    locale: 'en',
    currency: 'USD',
    role: 'user', // Will have merchant profile
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123!@#',
    locale: 'en',
    currency: 'USD',
    role: 'admin',
  },
  guestBuyer: {
    email: 'guest@test.com',
    password: 'Test123!@#',
    locale: 'en',
    currency: 'USD',
    role: 'user',
  },
  merchantRub: {
    email: 'merchant.ru@test.com',
    password: 'Test123!@#',
    locale: 'ru',
    currency: 'RUB',
    role: 'user',
  },
};

/**
 * Test addresses
 */
export const testAddresses = {
  usAddress: {
    fullName: 'John Doe',
    addressLine1: '123 Main St',
    addressLine2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    phone: '+1234567890',
  },
  ukAddress: {
    fullName: 'Jane Smith',
    addressLine1: '456 Oxford St',
    addressLine2: '',
    city: 'London',
    state: 'England',
    postalCode: 'SW1A 1AA',
    country: 'GB',
    phone: '+447123456789',
  },
  ruAddress: {
    fullName: 'Иван Петров',
    addressLine1: 'ул. Ленина, д. 1',
    addressLine2: 'кв. 10',
    city: 'Москва',
    state: 'Московская область',
    postalCode: '101000',
    country: 'RU',
    phone: '+79001234567',
  },
};

/**
 * Test payment methods
 */
export const testPaymentMethods = {
  card: {
    type: 'card',
    last4: '4242',
    brand: 'visa',
    expiryMonth: 12,
    expiryYear: 2025,
  },
  cardRu: {
    type: 'card',
    last4: '0000',
    brand: 'mir',
    expiryMonth: 12,
    expiryYear: 2025,
  },
};
