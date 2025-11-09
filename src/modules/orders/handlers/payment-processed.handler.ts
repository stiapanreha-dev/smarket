import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentProcessedEvent } from '../events/order-events';

/**
 * Handler for PaymentProcessed events
 */
@Injectable()
export class PaymentProcessedHandler {
  private readonly logger = new Logger(PaymentProcessedHandler.name);

  @OnEvent('PaymentProcessed')
  async handle(event: PaymentProcessedEvent): Promise<void> {
    this.logger.log(`Handling PaymentProcessed event for order ${event.payload.orderNumber}`);

    try {
      await Promise.all([
        this.sendPaymentConfirmation(event),
        this.updateAccountingSystem(event),
        this.trackPaymentAnalytics(event),
        this.triggerFulfillment(event),
      ]);

      this.logger.log(
        `Successfully processed PaymentProcessed event for order ${event.payload.orderNumber}`,
      );
    } catch (error) {
      this.logger.error(`Failed to process PaymentProcessed event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send payment confirmation to customer
   */
  private async sendPaymentConfirmation(event: PaymentProcessedEvent): Promise<void> {
    this.logger.debug(`Sending payment confirmation for order ${event.payload.orderNumber}`);

    // In production:
    // await this.emailService.send({
    //   template: 'payment-confirmation',
    //   data: {
    //     orderNumber: event.payload.orderNumber,
    //     amount: event.payload.amount,
    //     currency: event.payload.currency,
    //     paymentMethod: event.payload.paymentMethod,
    //   },
    // });

    await this.simulateAsyncOperation(100);
  }

  /**
   * Update accounting system
   */
  private async updateAccountingSystem(event: PaymentProcessedEvent): Promise<void> {
    this.logger.debug(`Updating accounting system for order ${event.payload.orderNumber}`);

    // In production:
    // await this.accountingService.recordRevenue({
    //   orderId: event.payload.orderId,
    //   amount: event.payload.amount,
    //   currency: event.payload.currency,
    //   paymentIntentId: event.payload.paymentIntentId,
    //   date: event.payload.processedAt,
    // });

    await this.simulateAsyncOperation(150);
  }

  /**
   * Track payment in analytics
   */
  private async trackPaymentAnalytics(event: PaymentProcessedEvent): Promise<void> {
    this.logger.debug(`Tracking payment analytics for order ${event.payload.orderNumber}`);

    // In production:
    // await this.analyticsService.track({
    //   event: 'Payment Processed',
    //   properties: {
    //     orderId: event.payload.orderId,
    //     revenue: event.payload.amount / 100,
    //     currency: event.payload.currency,
    //     paymentMethod: event.payload.paymentMethod,
    //   },
    // });

    await this.simulateAsyncOperation(50);
  }

  /**
   * Trigger order fulfillment
   */
  private async triggerFulfillment(event: PaymentProcessedEvent): Promise<void> {
    this.logger.debug(`Triggering fulfillment for order ${event.payload.orderNumber}`);

    // In production:
    // await this.fulfillmentService.startFulfillment({
    //   orderId: event.payload.orderId,
    //   orderNumber: event.payload.orderNumber,
    // });

    await this.simulateAsyncOperation(100);
  }

  private async simulateAsyncOperation(delayMs: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
