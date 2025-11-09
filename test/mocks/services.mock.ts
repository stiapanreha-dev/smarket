/**
 * Mock Outbox Service
 */
export const createMockOutboxService = () => ({
  addEvent: jest.fn().mockResolvedValue(undefined),
  processEvents: jest.fn().mockResolvedValue(undefined),
});

/**
 * Mock Email Service
 */
export const createMockEmailService = () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  sendOrderConfirmation: jest.fn().mockResolvedValue(true),
  sendPaymentConfirmation: jest.fn().mockResolvedValue(true),
  sendShippingNotification: jest.fn().mockResolvedValue(true),
});

/**
 * Mock Cache Service
 */
export const createMockCacheService = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  clear: jest.fn(),
});

/**
 * Mock Audit Log Service
 */
export const createMockAuditLogService = () => ({
  log: jest.fn().mockResolvedValue(undefined),
  logUserAction: jest.fn().mockResolvedValue(undefined),
  logSystemEvent: jest.fn().mockResolvedValue(undefined),
});

/**
 * Mock FSM Service
 */
export const createMockFSMService = () => ({
  transitionLineItem: jest.fn().mockImplementation(async (lineItemId, newStatus) => ({
    id: lineItemId,
    status: newStatus,
  })),
  canTransition: jest.fn().mockReturnValue(true),
  getAvailableTransitions: jest.fn().mockReturnValue([]),
});

/**
 * Mock Split Calculation Service
 */
export const createMockSplitCalculationService = () => ({
  calculateSplits: jest.fn().mockResolvedValue([
    {
      merchant_id: 'merchant-1',
      gross_amount: 2999,
      platform_fee: 299,
      processing_fee: 87,
      net_amount: 2613,
    },
  ]),
  calculateEscrowReleaseDate: jest.fn().mockReturnValue(new Date()),
  calculateRefundSplit: jest.fn().mockReturnValue({
    platform_refund: 299,
    merchant_refund: 2700,
  }),
});

/**
 * Mock Config Service
 */
export const createMockConfigService = () => ({
  get: jest.fn((key: string) => {
    const config: Record<string, any> = {
      FRONTEND_URL: 'http://localhost:3000',
      STRIPE_SECRET_KEY: 'sk_test_123',
      PLATFORM_FEE_PERCENTAGE: 10,
    };
    return config[key];
  }),
  getOrThrow: jest.fn(),
});

/**
 * Mock Notification Service
 */
export const createMockNotificationService = () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
  sendOrderUpdate: jest.fn().mockResolvedValue(undefined),
  sendPaymentUpdate: jest.fn().mockResolvedValue(undefined),
});
