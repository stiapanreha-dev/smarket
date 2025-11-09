/**
 * Test product fixtures
 */
export const testProducts = {
  physicalProduct: {
    name: 'Test Physical Product',
    description: 'A physical product for testing',
    type: 'physical',
    price: 2999, // $29.99
    currency: 'USD',
    sku: 'TEST-PHYS-001',
    stock_quantity: 100,
    is_active: true,
    weight: 500, // 500g
    dimensions: {
      length: 10,
      width: 10,
      height: 5,
      unit: 'cm',
    },
  },
  digitalProduct: {
    name: 'Test Digital Product',
    description: 'A digital product for testing',
    type: 'digital',
    price: 999, // $9.99
    currency: 'USD',
    sku: 'TEST-DIGI-001',
    is_active: true,
    digital_content: {
      downloadUrl: 'https://example.com/download',
      fileSize: 1024000,
      fileType: 'pdf',
    },
  },
  serviceProduct: {
    name: 'Test Service',
    description: 'A service for testing',
    type: 'service',
    price: 5000, // $50.00
    currency: 'USD',
    sku: 'TEST-SERV-001',
    is_active: true,
    service_duration: 60, // 60 minutes
  },
  expensiveProduct: {
    name: 'Expensive Product',
    description: 'An expensive product for testing',
    type: 'physical',
    price: 99999, // $999.99
    currency: 'USD',
    sku: 'TEST-PHYS-EXP',
    stock_quantity: 10,
    is_active: true,
  },
  outOfStockProduct: {
    name: 'Out of Stock Product',
    description: 'A product that is out of stock',
    type: 'physical',
    price: 1999,
    currency: 'USD',
    sku: 'TEST-PHYS-OOS',
    stock_quantity: 0,
    is_active: true,
  },
  inactiveProduct: {
    name: 'Inactive Product',
    description: 'An inactive product',
    type: 'physical',
    price: 1999,
    currency: 'USD',
    sku: 'TEST-PHYS-INA',
    stock_quantity: 100,
    is_active: false,
  },
};

/**
 * Test cart items
 */
export const testCartItems = {
  singleItem: [
    {
      productId: 'product-1',
      quantity: 1,
      price: 2999,
      type: 'physical',
    },
  ],
  multipleItems: [
    {
      productId: 'product-1',
      quantity: 2,
      price: 2999,
      type: 'physical',
    },
    {
      productId: 'product-2',
      quantity: 1,
      price: 999,
      type: 'digital',
    },
  ],
  mixedTypes: [
    {
      productId: 'product-1',
      quantity: 1,
      price: 2999,
      type: 'physical',
    },
    {
      productId: 'product-2',
      quantity: 1,
      price: 999,
      type: 'digital',
    },
    {
      productId: 'product-3',
      quantity: 1,
      price: 5000,
      type: 'service',
    },
  ],
};
