import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '../events/order-events';

/**
 * Handler for OrderCreated events
 * Demonstrates exactly-once processing guarantee through outbox pattern
 */
@Injectable()
export class OrderCreatedHandler {
  private readonly logger = new Logger(OrderCreatedHandler.name);

  @OnEvent('OrderCreated')
  async handle(event: OrderCreatedEvent): Promise<void> {
    this.logger.log(
      `Handling OrderCreated event for order ${event.payload.orderNumber}`,
    );

    try {
      // Execute all side effects
      await Promise.all([
        this.sendOrderConfirmationEmail(event),
        this.updateSearchIndex(event),
        this.trackAnalytics(event),
        this.notifyWarehouse(event),
      ]);

      this.logger.log(
        `Successfully processed OrderCreated event for order ${event.payload.orderNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process OrderCreated event: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw to trigger retry
    }
  }

  /**
   * Send order confirmation email to customer
   */
  private async sendOrderConfirmationEmail(
    event: OrderCreatedEvent,
  ): Promise<void> {
    const customerEmail =
      event.payload.userId || event.payload.guestEmail || 'unknown';

    this.logger.debug(
      `Sending order confirmation email to ${customerEmail} for order ${event.payload.orderNumber}`,
    );

    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    // Example:
    // await this.emailService.send({
    //   to: customerEmail,
    //   template: 'order-confirmation',
    //   data: {
    //     orderNumber: event.payload.orderNumber,
    //     items: event.payload.items,
    //     totalAmount: event.payload.totalAmount,
    //     currency: event.payload.currency,
    //   },
    // });

    // Simulate async email sending
    await this.simulateAsyncOperation(100);
  }

  /**
   * Update search index with new order data
   */
  private async updateSearchIndex(event: OrderCreatedEvent): Promise<void> {
    this.logger.debug(
      `Updating search index for order ${event.payload.orderNumber}`,
    );

    // In production, integrate with search service (Elasticsearch, Algolia, etc.)
    // Example:
    // await this.searchService.index('orders', {
    //   id: event.payload.orderId,
    //   orderNumber: event.payload.orderNumber,
    //   customerEmail: event.payload.guestEmail,
    //   totalAmount: event.payload.totalAmount,
    //   createdAt: event.createdAt,
    // });

    await this.simulateAsyncOperation(50);
  }

  /**
   * Track order creation in analytics
   */
  private async trackAnalytics(event: OrderCreatedEvent): Promise<void> {
    this.logger.debug(
      `Tracking analytics for order ${event.payload.orderNumber}`,
    );

    // In production, integrate with analytics service (Segment, Mixpanel, etc.)
    // Example:
    // await this.analyticsService.track({
    //   event: 'Order Created',
    //   userId: event.payload.userId,
    //   properties: {
    //     orderId: event.payload.orderId,
    //     orderNumber: event.payload.orderNumber,
    //     revenue: event.payload.totalAmount / 100,
    //     currency: event.payload.currency,
    //     products: event.payload.items.map(item => ({
    //       id: item.productId,
    //       name: item.productName,
    //       quantity: item.quantity,
    //       price: item.unitPrice / 100,
    //     })),
    //   },
    // });

    await this.simulateAsyncOperation(50);
  }

  /**
   * Notify warehouse about new order
   */
  private async notifyWarehouse(event: OrderCreatedEvent): Promise<void> {
    this.logger.debug(
      `Notifying warehouse about order ${event.payload.orderNumber}`,
    );

    // In production, publish to message queue or call warehouse API
    // Example:
    // await this.messageQueue.publish('warehouse.orders.new', {
    //   orderId: event.payload.orderId,
    //   orderNumber: event.payload.orderNumber,
    //   items: event.payload.items,
    //   shippingAddress: event.payload.shippingAddress,
    // });

    await this.simulateAsyncOperation(100);
  }

  /**
   * Simulate async operation (for demo purposes)
   */
  private async simulateAsyncOperation(delayMs: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
