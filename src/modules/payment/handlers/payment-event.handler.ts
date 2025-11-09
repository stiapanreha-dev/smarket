import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentService } from '../services/payment.service';
import {
  PhysicalItemStatus,
  DigitalItemStatus,
  ServiceItemStatus,
} from '../../../database/entities/order-line-item.entity';

/**
 * Payment event handler
 * Listens to order FSM events and triggers payment captures
 */
@Injectable()
export class PaymentEventHandler {
  private readonly logger = new Logger(PaymentEventHandler.name);

  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Handle order confirmation - capture payment for digital items
   */
  @OnEvent('order.confirmed')
  async handleOrderConfirmed(event: any): Promise<void> {
    const { orderId, lineItems } = event;

    this.logger.log(`Processing order confirmation for order ${orderId}`);

    // Check if order has digital items
    const hasDigitalItems = lineItems?.some((item: any) => item.type === 'digital');

    if (hasDigitalItems) {
      try {
        const payment = await this.paymentService.getPaymentByOrderId(orderId);

        if (payment && payment.status === 'authorized') {
          this.logger.log(
            `Auto-capturing payment ${payment.id} for digital items in order ${orderId}`,
          );
          await this.paymentService.capturePayment(payment.id);
        }
      } catch (error) {
        this.logger.error(`Failed to capture payment for order ${orderId}: ${error.message}`);
      }
    }
  }

  /**
   * Handle physical item preparation - capture payment
   */
  @OnEvent('line_item.status_changed')
  async handleLineItemStatusChanged(event: any): Promise<void> {
    const { lineItemId, orderId, fromStatus, toStatus, type } = event;

    // Capture payment when physical item moves to PREPARING
    if (
      type === 'physical' &&
      fromStatus === PhysicalItemStatus.PAYMENT_CONFIRMED &&
      toStatus === PhysicalItemStatus.PREPARING
    ) {
      try {
        const payment = await this.paymentService.getPaymentByOrderId(orderId);

        if (payment && payment.status === 'authorized') {
          this.logger.log(`Auto-capturing payment ${payment.id} for physical item ${lineItemId}`);
          await this.paymentService.capturePayment(payment.id);
        }
      } catch (error) {
        this.logger.error(
          `Failed to capture payment for line item ${lineItemId}: ${error.message}`,
        );
      }
    }

    // Capture payment when service booking is confirmed
    if (
      type === 'service' &&
      fromStatus === ServiceItemStatus.PAYMENT_CONFIRMED &&
      toStatus === ServiceItemStatus.BOOKING_CONFIRMED
    ) {
      try {
        const payment = await this.paymentService.getPaymentByOrderId(orderId);

        if (payment && payment.status === 'authorized') {
          this.logger.log(`Auto-capturing payment ${payment.id} for service item ${lineItemId}`);
          await this.paymentService.capturePayment(payment.id);
        }
      } catch (error) {
        this.logger.error(
          `Failed to capture payment for service item ${lineItemId}: ${error.message}`,
        );
      }
    }

    // Capture payment when digital access is granted
    if (
      type === 'digital' &&
      fromStatus === DigitalItemStatus.PAYMENT_CONFIRMED &&
      toStatus === DigitalItemStatus.ACCESS_GRANTED
    ) {
      try {
        const payment = await this.paymentService.getPaymentByOrderId(orderId);

        if (payment && payment.status === 'authorized') {
          this.logger.log(`Auto-capturing payment ${payment.id} for digital item ${lineItemId}`);
          await this.paymentService.capturePayment(payment.id);
        }
      } catch (error) {
        this.logger.error(
          `Failed to capture payment for digital item ${lineItemId}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Handle refund requests
   */
  @OnEvent('line_item.refund_requested')
  async handleRefundRequested(event: any): Promise<void> {
    const { lineItemId, orderId, amount, reason } = event;

    this.logger.log(`Processing refund request for line item ${lineItemId}`);

    try {
      const payment = await this.paymentService.getPaymentByOrderId(orderId);

      if (payment && payment.status === 'captured') {
        this.logger.log(`Creating refund for payment ${payment.id}`);

        await this.paymentService.refundPayment(
          payment.id,
          amount,
          reason || 'Customer requested refund',
          lineItemId,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to process refund for line item ${lineItemId}: ${error.message}`);
    }
  }

  /**
   * Handle payment captured event - update order status
   */
  @OnEvent('payment.captured')
  async handlePaymentCaptured(event: any): Promise<void> {
    const { paymentId, orderId } = event.payload;

    this.logger.log(`Payment ${paymentId} captured for order ${orderId}`);

    // This event can be used to trigger notifications, analytics, etc.
    // The order FSM will handle the actual status transitions
  }

  /**
   * Handle payment refunded event
   */
  @OnEvent('payment.refunded')
  async handlePaymentRefunded(event: any): Promise<void> {
    const { refundId, paymentId, orderId, amount } = event.payload;

    this.logger.log(`Refund ${refundId} processed for payment ${paymentId}, amount: ${amount}`);

    // This event can trigger notifications to customer and merchant
  }
}
