import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WebhookEvent } from '../../../database/entities/webhook-event.entity';
import { Payment, PaymentStatusEnum } from '../../../database/entities/payment.entity';
import { PaymentService } from './payment.service';
import { PaymentProvider } from '../interfaces/payment-provider.interface';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookEvent)
    private readonly webhookEventRepository: Repository<WebhookEvent>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly paymentService: PaymentService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Process webhook from payment provider
   */
  async processWebhook(
    provider: string,
    payload: any,
    signature: string,
  ): Promise<void> {
    // 1. Get provider instance
    const providerInstance = this.paymentService.getProvider(provider);

    // 2. Verify signature
    const isValid = providerInstance.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // 3. Parse event
    const event = providerInstance.parseWebhookEvent(payload);

    // 4. Check for duplicate (idempotency)
    const existingEvent = await this.webhookEventRepository.findOne({
      where: {
        provider,
        provider_event_id: event.id,
      },
    });

    if (existingEvent && existingEvent.processed) {
      this.logger.log(`Webhook event ${event.id} already processed, skipping`);
      return;
    }

    // 5. Process event in transaction
    await this.dataSource.transaction(async (manager) => {
      // Save webhook event
      const webhookEvent = existingEvent || manager.create(WebhookEvent, {
        provider,
        provider_event_id: event.id,
        event_type: event.type,
        payload: event.data,
      });

      try {
        // Process event based on type
        await this.handleWebhookEvent(provider, event, manager);

        // Mark as processed
        webhookEvent.processed = true;
        webhookEvent.processed_at = new Date();
      } catch (error) {
        this.logger.error(`Failed to process webhook event ${event.id}: ${error.message}`);
        webhookEvent.error_message = error.message;
        throw error;
      } finally {
        await manager.save(webhookEvent);
      }
    });

    this.logger.log(`Processed webhook event ${event.id} from ${provider}`);
  }

  /**
   * Handle specific webhook event types
   */
  private async handleWebhookEvent(
    provider: string,
    event: any,
    manager: any,
  ): Promise<void> {
    const eventType = event.type.toLowerCase();

    this.logger.debug(`Handling webhook event: ${eventType}`);

    // Handle Stripe events
    if (provider === 'stripe') {
      await this.handleStripeEvent(eventType, event, manager);
    }
    // Handle YooKassa events
    else if (provider === 'yookassa') {
      await this.handleYooKassaEvent(eventType, event, manager);
    }
    // Handle Network International events
    else if (provider === 'network_intl') {
      await this.handleNetworkIntlEvent(eventType, event, manager);
    }
  }

  /**
   * Handle Stripe webhook events
   */
  private async handleStripeEvent(
    eventType: string,
    event: any,
    manager: any,
  ): Promise<void> {
    const paymentIntentId = event.paymentIntentId || event.data?.id;

    switch (eventType) {
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
        await this.updatePaymentStatus(paymentIntentId, eventType, event.data, manager);
        break;

      case 'payment_intent.amount_capturable_updated':
        await this.handleAuthorizationUpdate(paymentIntentId, event.data, manager);
        break;

      case 'charge.refunded':
        await this.handleRefundEvent(paymentIntentId, event.data, manager);
        break;

      default:
        this.logger.debug(`Unhandled Stripe event type: ${eventType}`);
    }
  }

  /**
   * Handle YooKassa webhook events
   */
  private async handleYooKassaEvent(
    eventType: string,
    event: any,
    manager: any,
  ): Promise<void> {
    const paymentId = event.paymentIntentId || event.data?.id;

    switch (eventType) {
      case 'payment.succeeded':
      case 'payment.canceled':
        await this.updatePaymentStatus(paymentId, eventType, event.data, manager);
        break;

      case 'refund.succeeded':
        await this.handleRefundEvent(paymentId, event.data, manager);
        break;

      default:
        this.logger.debug(`Unhandled YooKassa event type: ${eventType}`);
    }
  }

  /**
   * Handle Network International webhook events
   */
  private async handleNetworkIntlEvent(
    eventType: string,
    event: any,
    manager: any,
  ): Promise<void> {
    const paymentId = event.paymentIntentId || event.data?.order?.reference;

    switch (eventType) {
      case 'payment.captured':
      case 'payment.failed':
        await this.updatePaymentStatus(paymentId, eventType, event.data, manager);
        break;

      default:
        this.logger.debug(`Unhandled Network International event type: ${eventType}`);
    }
  }

  /**
   * Update payment status based on webhook
   */
  private async updatePaymentStatus(
    providerPaymentId: string,
    eventType: string,
    eventData: any,
    manager: any,
  ): Promise<void> {
    const payment = await manager.findOne(Payment, {
      where: { provider_payment_id: providerPaymentId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for provider payment ID: ${providerPaymentId}`);
      return;
    }

    // Map event type to payment status
    const statusMap: Record<string, string> = {
      'payment_intent.succeeded': PaymentStatusEnum.AUTHORIZED,
      'payment_intent.payment_failed': PaymentStatusEnum.FAILED,
      'payment.succeeded': PaymentStatusEnum.CAPTURED,
      'payment.canceled': PaymentStatusEnum.CANCELLED,
      'payment.captured': PaymentStatusEnum.CAPTURED,
      'payment.failed': PaymentStatusEnum.FAILED,
    };

    const newStatus = statusMap[eventType];
    if (!newStatus) {
      this.logger.warn(`No status mapping for event type: ${eventType}`);
      return;
    }

    // Update payment
    payment.status = newStatus;

    if (newStatus === PaymentStatusEnum.AUTHORIZED) {
      payment.authorized_amount = eventData.amount || payment.amount_minor;
      payment.authorized_at = new Date();
    } else if (newStatus === PaymentStatusEnum.CAPTURED) {
      payment.captured_amount = eventData.amount || payment.amount_minor;
      payment.captured_at = new Date();
    } else if (newStatus === PaymentStatusEnum.FAILED) {
      payment.error_message = eventData.error_message || 'Payment failed';
      payment.failed_at = new Date();
    }

    await manager.save(payment);

    this.logger.log(
      `Updated payment ${payment.id} status to ${newStatus} from webhook`,
    );
  }

  /**
   * Handle authorization update event
   */
  private async handleAuthorizationUpdate(
    providerPaymentId: string,
    eventData: any,
    manager: any,
  ): Promise<void> {
    const payment = await manager.findOne(Payment, {
      where: { provider_payment_id: providerPaymentId },
    });

    if (!payment) {
      return;
    }

    payment.authorized_amount = eventData.amount_capturable || eventData.amount;
    await manager.save(payment);
  }

  /**
   * Handle refund event
   */
  private async handleRefundEvent(
    providerPaymentId: string,
    eventData: any,
    manager: any,
  ): Promise<void> {
    const payment = await manager.findOne(Payment, {
      where: { provider_payment_id: providerPaymentId },
    });

    if (!payment) {
      return;
    }

    // Update refunded amount if needed
    const refundedAmount = eventData.amount_refunded || eventData.refunded_amount;
    if (refundedAmount !== undefined) {
      payment.refunded_amount = refundedAmount;

      if (payment.refunded_amount === payment.captured_amount) {
        payment.status = PaymentStatusEnum.REFUNDED;
      } else if (payment.refunded_amount > 0) {
        payment.status = PaymentStatusEnum.PARTIALLY_REFUNDED;
      }

      await manager.save(payment);
    }
  }

  /**
   * Get webhook event history
   */
  async getWebhookEvents(
    provider?: string,
    processed?: boolean,
    limit: number = 50,
  ): Promise<WebhookEvent[]> {
    const query: any = {};

    if (provider) {
      query.provider = provider;
    }

    if (processed !== undefined) {
      query.processed = processed;
    }

    return this.webhookEventRepository.find({
      where: query,
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
