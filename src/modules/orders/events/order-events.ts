/**
 * Base interface for all order events
 */
export interface BaseOrderEvent {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  createdAt: Date;
}

/**
 * Order Created Event
 */
export interface OrderCreatedEvent extends BaseOrderEvent {
  eventType: 'OrderCreated';
  payload: {
    orderId: string;
    orderNumber: string;
    userId: string | null;
    guestEmail: string | null;
    totalAmount: number;
    currency: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
    }>;
    shippingAddress: any;
    billingAddress: any;
  };
}

/**
 * Order Confirmed Event
 */
export interface OrderConfirmedEvent extends BaseOrderEvent {
  eventType: 'OrderConfirmed';
  payload: {
    orderId: string;
    orderNumber: string;
    confirmedAt: Date;
  };
}

/**
 * Payment Processed Event
 */
export interface PaymentProcessedEvent extends BaseOrderEvent {
  eventType: 'PaymentProcessed';
  payload: {
    orderId: string;
    orderNumber: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    processedAt: Date;
  };
}

/**
 * Order Completed Event
 */
export interface OrderCompletedEvent extends BaseOrderEvent {
  eventType: 'OrderCompleted';
  payload: {
    orderId: string;
    orderNumber: string;
    completedAt: Date;
  };
}

/**
 * Order Cancelled Event
 */
export interface OrderCancelledEvent extends BaseOrderEvent {
  eventType: 'OrderCancelled';
  payload: {
    orderId: string;
    orderNumber: string;
    reason: string;
    cancelledAt: Date;
  };
}

/**
 * Union type of all order events
 */
export type OrderEvent =
  | OrderCreatedEvent
  | OrderConfirmedEvent
  | PaymentProcessedEvent
  | OrderCompletedEvent
  | OrderCancelledEvent;
