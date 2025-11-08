# Sprint 5: Payments Integration
## Financial Foundation (День 26-30)

**Dates:** 19-23 Февраля 2024  
**Goal:** Реализовать платежную систему с split-payments для маркетплейса  
**Team Focus:** Backend - 80%, Frontend - 20%  

---

## 🎯 Sprint Goals

1. **Payment Processing** - Интеграция с платежными провайдерами
2. **Split Payments** - Разделение платежей между продавцами
3. **Escrow System** - Холдирование средств до подтверждения
4. **Refunds** - Обработка возвратов
5. **Reconciliation** - Сверка платежей

---

## 📋 User Stories

### PAY-001: Payment Processing Integration (13 SP)
**As a** customer  
**I want** to pay for my order securely  
**So that** I can complete my purchase  

**Backend Implementation:**
```typescript
// src/modules/payment/providers/stripe.provider.ts
@Injectable()
export class StripeProvider implements PaymentProvider {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent> {
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency.toLowerCase(),
        payment_method_types: this.getPaymentMethods(params.currency),
        capture_method: 'manual', // We'll capture after confirmation
        metadata: {
          orderId: params.orderId,
          userId: params.userId,
          merchantIds: params.merchantIds.join(','),
        },
        // Enable 3D Secure
        payment_method_options: {
          card: {
            request_three_d_secure: 'automatic',
          },
        },
        // For Stripe Connect (split payments)
        transfer_group: params.orderId,
      });

      return {
        id: intent.id,
        clientSecret: intent.client_secret,
        amount: intent.amount,
        currency: intent.currency,
        status: this.mapStripeStatus(intent.status),
        requiresAction: intent.status === 'requires_action',
        actionUrl: intent.next_action?.redirect_to_url?.url,
      };
    } catch (error) {
      throw new PaymentProviderError('Stripe', error.message, error.code);
    }
  }

  async capturePayment(paymentIntentId: string, amount?: number): Promise<PaymentResult> {
    try {
      const intent = await this.stripe.paymentIntents.capture(
        paymentIntentId,
        amount ? { amount_to_capture: amount } : undefined
      );

      // Create transfers to connected accounts (merchants)
      if (intent.metadata.merchantIds) {
        await this.createTransfers(intent);
      }

      return {
        success: true,
        transactionId: intent.id,
        amount: intent.amount_received,
        status: this.mapStripeStatus(intent.status),
      };
    } catch (error) {
      throw new PaymentProviderError('Stripe', error.message, error.code);
    }
  }

  private async createTransfers(paymentIntent: any): Promise<void> {
    const merchantIds = paymentIntent.metadata.merchantIds.split(',');
    const splits = await this.calculateSplits(paymentIntent);

    for (const split of splits) {
      await this.stripe.transfers.create({
        amount: split.netAmount,
        currency: paymentIntent.currency,
        destination: split.stripeAccountId, // Merchant's connected account
        transfer_group: paymentIntent.metadata.orderId,
        metadata: {
          orderId: paymentIntent.metadata.orderId,
          merchantId: split.merchantId,
          platformFee: split.platformFee,
        },
      });
    }
  }

  private getPaymentMethods(currency: string): string[] {
    const methods = {
      'USD': ['card', 'apple_pay', 'google_pay'],
      'AED': ['card', 'apple_pay', 'google_pay'],
      'RUB': ['card'], // Limited in Russia
    };
    return methods[currency] || ['card'];
  }
}

// src/modules/payment/providers/yookassa.provider.ts (Russia)
@Injectable()
export class YooKassaProvider implements PaymentProvider {
  private client: YooKassa;

  constructor(private configService: ConfigService) {
    this.client = new YooKassa({
      shopId: configService.get('YOOKASSA_SHOP_ID'),
      secretKey: configService.get('YOOKASSA_SECRET_KEY'),
    });
  }

  async createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent> {
    const payment = await this.client.createPayment({
      amount: {
        value: (params.amount / 100).toFixed(2), // YooKassa uses major units
        currency: params.currency,
      },
      payment_method_data: {
        type: params.paymentMethod || 'bank_card',
      },
      confirmation: {
        type: 'redirect',
        return_url: `${params.returnUrl}/payment/confirm`,
      },
      capture: false, // Manual capture
      description: `Order ${params.orderId}`,
      metadata: {
        orderId: params.orderId,
        userId: params.userId,
      },
      receipt: this.createReceipt(params), // For fiscalization
    });

    return {
      id: payment.id,
      confirmationUrl: payment.confirmation.confirmation_url,
      amount: Math.round(parseFloat(payment.amount.value) * 100),
      currency: payment.amount.currency,
      status: this.mapYooKassaStatus(payment.status),
    };
  }

  private createReceipt(params: CreatePaymentParams): any {
    // Russian fiscalization requirements
    return {
      customer: {
        email: params.customerEmail,
        phone: params.customerPhone,
      },
      items: params.items.map(item => ({
        description: item.name,
        amount: {
          value: (item.price / 100).toFixed(2),
          currency: params.currency,
        },
        vat_code: this.getVatCode(item.type),
        quantity: item.quantity,
        payment_subject: this.getPaymentSubject(item.type),
        payment_mode: 'full_payment',
      })),
    };
  }

  private getVatCode(itemType: string): number {
    // Russian VAT codes
    const vatCodes = {
      'physical': 4, // VAT 20%
      'digital': 4,  // VAT 20%
      'service': 4,  // VAT 20%
    };
    return vatCodes[itemType] || 4;
  }
}

// src/modules/payment/services/payment.service.ts
@Injectable()
export class PaymentService {
  private providers: Map<string, PaymentProvider> = new Map();

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentSplit)
    private splitRepository: Repository<PaymentSplit>,
    private stripeProvider: StripeProvider,
    private yooKassaProvider: YooKassaProvider,
    private outboxService: OutboxService,
    @InjectRedis() private redis: Redis,
  ) {
    this.providers.set('stripe', stripeProvider);
    this.providers.set('yookassa', yooKassaProvider);
  }

  async processPayment(
    order: Order,
    paymentMethodId: string,
    idempotencyKey: string,
  ): Promise<Payment> {
    // Check idempotency
    const existingPayment = await this.paymentRepository.findOne({
      where: { idempotencyKey },
    });

    if (existingPayment) {
      return existingPayment;
    }

    // Distributed lock to prevent double payment
    const lockKey = `payment:lock:${order.id}`;
    const lock = await this.redis.set(lockKey, '1', 'NX', 'EX', 30);
    
    if (!lock) {
      throw new ConflictException('Payment already in progress');
    }

    try {
      return await this.paymentRepository.manager.transaction(async manager => {
        // Create payment record
        const payment = manager.create(Payment, {
          orderId: order.id,
          amount: order.totalAmount,
          currency: order.currency,
          status: 'pending',
          provider: this.selectProvider(order),
          idempotencyKey,
          metadata: {
            ip: order.metadata?.ip,
            userAgent: order.metadata?.userAgent,
          },
        });

        await manager.save(payment);

        // Create payment splits
        const splits = await this.createPaymentSplits(order, payment, manager);
        await manager.save(splits);

        // Process with provider
        const provider = this.providers.get(payment.provider);
        const paymentIntent = await provider.createPaymentIntent({
          amount: payment.amount,
          currency: payment.currency,
          orderId: order.id,
          userId: order.userId,
          merchantIds: splits.map(s => s.merchantId),
          customerEmail: order.guestEmail || order.user?.email,
          items: order.lineItems.map(li => ({
            name: li.productName,
            price: li.unitPrice,
            quantity: li.quantity,
            type: li.type,
          })),
        });

        // Update payment with provider response
        payment.providerPaymentId = paymentIntent.id;
        payment.status = paymentIntent.status;
        payment.requiresAction = paymentIntent.requiresAction;
        payment.actionUrl = paymentIntent.actionUrl;
        
        await manager.save(payment);

        // Add to outbox
        await this.outboxService.addEvent(
          'payment.initiated',
          {
            paymentId: payment.id,
            orderId: order.id,
            provider: payment.provider,
          },
          manager,
        );

        return payment;
      });
    } finally {
      await this.redis.del(lockKey);
    }
  }

  private async createPaymentSplits(
    order: Order,
    payment: Payment,
    manager: EntityManager,
  ): Promise<PaymentSplit[]> {
    // Group line items by merchant
    const itemsByMerchant = _.groupBy(order.lineItems, 'merchantId');
    const splits: PaymentSplit[] = [];

    for (const [merchantId, items] of Object.entries(itemsByMerchant)) {
      const grossAmount = items.reduce(
        (sum, item) => sum + item.totalPrice,
        0,
      );

      const merchant = await manager.findOne(Merchant, {
        where: { id: merchantId },
      });

      const platformFeeRate = merchant.commissionRate || 0.15;
      const platformFee = Math.round(grossAmount * platformFeeRate);
      const processingFee = Math.round(grossAmount * 0.029 + 30); // 2.9% + 30¢
      const netAmount = grossAmount - platformFee - processingFee;

      const split = manager.create(PaymentSplit, {
        paymentId: payment.id,
        merchantId,
        grossAmount,
        platformFee,
        processingFee,
        netAmount,
        currency: payment.currency,
        status: 'pending',
        escrowReleaseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      splits.push(split);
    }

    return splits;
  }

  async capturePayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['splits'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'authorized') {
      throw new BadRequestException(`Cannot capture payment in status ${payment.status}`);
    }

    const provider = this.providers.get(payment.provider);
    const result = await provider.capturePayment(
      payment.providerPaymentId,
      payment.amount,
    );

    payment.status = 'captured';
    payment.capturedAmount = result.amount;
    payment.updatedAt = new Date();

    await this.paymentRepository.save(payment);

    // Update splits status
    await this.splitRepository.update(
      { paymentId: payment.id },
      { status: 'captured' },
    );

    // Schedule escrow release
    await this.scheduleEscrowRelease(payment);

    // Emit event
    await this.outboxService.addEvent('payment.captured', {
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: payment.capturedAmount,
    });

    return payment;
  }

  private async scheduleEscrowRelease(payment: Payment): Promise<void> {
    for (const split of payment.splits) {
      const jobId = `escrow:release:${split.id}`;
      const delay = split.escrowReleaseDate.getTime() - Date.now();
      
      await this.redis.setex(
        jobId,
        Math.round(delay / 1000),
        JSON.stringify({
          splitId: split.id,
          action: 'release_escrow',
        }),
      );
    }
  }

  private selectProvider(order: Order): string {
    // Select provider based on currency/region
    if (order.currency === 'RUB') {
      return 'yookassa';
    } else if (order.currency === 'AED') {
      return 'network_intl';
    } else {
      return 'stripe';
    }
  }
}
```

---

### PAY-002: Refunds Processing (8 SP)
**As a** customer  
**I want** to get refunds for cancelled/returned items  
**So that** I get my money back  

**Implementation:**
```typescript
// src/modules/payment/services/refund.service.ts
@Injectable()
export class RefundService {
  constructor(
    @InjectRepository(Refund)
    private refundRepository: Repository<Refund>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentSplit)
    private splitRepository: Repository<PaymentSplit>,
    private paymentService: PaymentService,
    private outboxService: OutboxService,
  ) {}

  async createRefund(
    orderId: string,
    lineItemId: string,
    reason: string,
    userId: string,
  ): Promise<Refund> {
    return await this.refundRepository.manager.transaction(async manager => {
      // Get payment and line item
      const payment = await manager.findOne(Payment, {
        where: { orderId },
        relations: ['splits'],
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      const lineItem = await manager.findOne(OrderLineItem, {
        where: { id: lineItemId, orderId },
      });

      if (!lineItem) {
        throw new NotFoundException('Line item not found');
      }

      // Check if refund is allowed
      if (!this.canRefund(lineItem)) {
        throw new BadRequestException('Item cannot be refunded');
      }

      // Calculate refund amount
      const refundAmount = lineItem.totalPrice;

      // Check if amount exceeds captured amount
      const totalRefunded = payment.refundedAmount + refundAmount;
      if (totalRefunded > payment.capturedAmount) {
        throw new BadRequestException('Refund amount exceeds captured amount');
      }

      // Create refund record
      const refund = manager.create(Refund, {
        paymentId: payment.id,
        orderLineItemId: lineItemId,
        amount: refundAmount,
        currency: payment.currency,
        reason,
        status: 'pending',
        createdBy: userId,
      });

      await manager.save(refund);

      // Process refund with provider
      const provider = this.paymentService.getProvider(payment.provider);
      const result = await provider.refundPayment(
        payment.providerPaymentId,
        refundAmount,
      );

      // Update refund status
      refund.status = 'processed';
      refund.providerRefundId = result.refundId;
      refund.processedAt = new Date();
      await manager.save(refund);

      // Update payment refunded amount
      payment.refundedAmount = totalRefunded;
      await manager.save(payment);

      // Update merchant split
      const merchantSplit = payment.splits.find(
        s => s.merchantId === lineItem.merchantId,
      );

      if (merchantSplit) {
        const refundRatio = refundAmount / payment.amount;
        const merchantRefund = Math.round(merchantSplit.netAmount * refundRatio);
        
        merchantSplit.netAmount -= merchantRefund;
        await manager.save(merchantSplit);
      }

      // Update line item status
      lineItem.status = 'refunded';
      await manager.save(lineItem);

      // Emit event
      await this.outboxService.addEvent(
        'refund.processed',
        {
          refundId: refund.id,
          orderId,
          lineItemId,
          amount: refundAmount,
        },
        manager,
      );

      return refund;
    });
  }

  private canRefund(lineItem: OrderLineItem): boolean {
    const nonRefundableStatuses = ['pending', 'refunded', 'refund_requested'];
    return !nonRefundableStatuses.includes(lineItem.status);
  }

  async getRefunds(orderId: string): Promise<Refund[]> {
    return this.refundRepository.find({
      where: { payment: { orderId } },
      relations: ['orderLineItem'],
      order: { createdAt: 'DESC' },
    });
  }
}
```

---

### PAY-003: Merchant Payouts (8 SP)
**As a** merchant  
**I want** to receive my earnings  
**So that** I can run my business  

**Implementation:**
```typescript
// src/modules/payment/services/payout.service.ts
@Injectable()
export class PayoutService {
  constructor(
    @InjectRepository(MerchantPayout)
    private payoutRepository: Repository<MerchantPayout>,
    @InjectRepository(PaymentSplit)
    private splitRepository: Repository<PaymentSplit>,
    private paymentService: PaymentService,
    private encryptionService: EncryptionService,
    @Inject(forwardRef(() => MerchantService))
    private merchantService: MerchantService,
  ) {}

  @Cron('0 0 * * MON') // Every Monday at midnight
  async processWeeklyPayouts(): Promise<void> {
    const merchants = await this.merchantService.getActiveWithWeeklyPayouts();
    
    for (const merchant of merchants) {
      try {
        await this.processMerchantPayout(merchant.id);
      } catch (error) {
        console.error(`Failed to process payout for merchant ${merchant.id}:`, error);
        // Continue with other merchants
      }
    }
  }

  async processMerchantPayout(merchantId: string): Promise<MerchantPayout> {
    return await this.payoutRepository.manager.transaction(async manager => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      // Get eligible splits
      const splits = await manager.find(PaymentSplit, {
        where: {
          merchantId,
          status: 'captured',
          escrowReleased: true,
          createdAt: Between(startDate, endDate),
        },
      });

      if (splits.length === 0) {
        return null; // No payouts needed
      }

      // Calculate totals
      const totals = splits.reduce(
        (acc, split) => ({
          gross: acc.gross + split.grossAmount,
          platformFees: acc.platformFees + split.platformFee,
          processingFees: acc.processingFees + split.processingFee,
          net: acc.net + split.netAmount,
        }),
        { gross: 0, platformFees: 0, processingFees: 0, net: 0 },
      );

      // Get merchant bank details
      const merchant = await this.merchantService.getMerchant(merchantId);
      const bankAccount = await this.decryptBankAccount(merchant.bankAccountData);

      // Create payout record
      const payout = manager.create(MerchantPayout, {
        merchantId,
        periodStart: startDate,
        periodEnd: endDate,
        grossAmount: totals.gross,
        platformFees: totals.platformFees,
        processingFees: totals.processingFees,
        netAmount: totals.net,
        currency: splits[0].currency,
        payoutMethod: merchant.payoutMethod,
        status: 'pending',
        bankAccountData: merchant.bankAccountData, // Keep encrypted
      });

      await manager.save(payout);

      // Process actual payout
      try {
        const provider = this.paymentService.getProvider(merchant.payoutProvider);
        const result = await provider.createPayout({
          amount: payout.netAmount,
          currency: payout.currency,
          destination: bankAccount,
          description: `Payout for period ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
          metadata: {
            payoutId: payout.id,
            merchantId,
          },
        });

        payout.payoutReference = result.transferId;
        payout.status = 'processing';
        await manager.save(payout);

        // Mark splits as paid out
        await manager.update(
          PaymentSplit,
          { id: In(splits.map(s => s.id)) },
          { payoutId: payout.id },
        );
      } catch (error) {
        payout.status = 'failed';
        payout.errorMessage = error.message;
        await manager.save(payout);
        throw error;
      }

      // Send notification
      await this.notificationService.sendPayoutNotification(merchant, payout);

      return payout;
    });
  }

  async getMerchantPayouts(
    merchantId: string,
    query: GetPayoutsQuery,
  ): Promise<PaginatedResult<MerchantPayout>> {
    const qb = this.payoutRepository
      .createQueryBuilder('payout')
      .where('payout.merchantId = :merchantId', { merchantId });

    if (query.status) {
      qb.andWhere('payout.status = :status', { status: query.status });
    }

    if (query.dateFrom) {
      qb.andWhere('payout.periodStart >= :dateFrom', { dateFrom: query.dateFrom });
    }

    if (query.dateTo) {
      qb.andWhere('payout.periodEnd <= :dateTo', { dateTo: query.dateTo });
    }

    qb.orderBy('payout.createdAt', 'DESC');

    const page = query.page || 1;
    const limit = query.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    const [payouts, total] = await qb.getManyAndCount();

    return {
      data: payouts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async decryptBankAccount(encryptedData: any): Promise<any> {
    if (!encryptedData) return null;
    
    const decrypted = await this.encryptionService.decrypt(encryptedData);
    return JSON.parse(decrypted);
  }
}
```

---

### PAY-004: Payment Reconciliation (5 SP)
**As a** platform  
**I want** to reconcile payments  
**So that** I can ensure financial accuracy  

**Implementation:**
```typescript
// src/modules/payment/services/reconciliation.service.ts
@Injectable()
export class ReconciliationService {
  constructor(
    @InjectRepository(PaymentReconciliation)
    private reconciliationRepository: Repository<PaymentReconciliation>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private stripeProvider: StripeProvider,
    private yooKassaProvider: YooKassaProvider,
  ) {}

  @Cron('0 2 * * *') // Daily at 2 AM
  async runDailyReconciliation(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const providers = ['stripe', 'yookassa'];
    
    for (const provider of providers) {
      try {
        await this.reconcileProvider(provider, yesterday);
      } catch (error) {
        console.error(`Reconciliation failed for ${provider}:`, error);
      }
    }
  }

  async reconcileProvider(
    provider: string,
    date: Date,
  ): Promise<PaymentReconciliation> {
    // Get transactions from provider
    const providerTransactions = await this.fetchProviderTransactions(provider, date);
    
    // Get our records
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const ourPayments = await this.paymentRepository.find({
      where: {
        provider,
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    // Match transactions
    const matched: any[] = [];
    const unmatched: any[] = [];
    const discrepancies: any[] = [];

    for (const providerTx of providerTransactions) {
      const ourPayment = ourPayments.find(
        p => p.providerPaymentId === providerTx.id,
      );

      if (!ourPayment) {
        unmatched.push({
          provider: providerTx,
          reason: 'not_found_in_our_system',
        });
      } else if (ourPayment.amount !== providerTx.amount) {
        discrepancies.push({
          paymentId: ourPayment.id,
          ourAmount: ourPayment.amount,
          providerAmount: providerTx.amount,
          difference: ourPayment.amount - providerTx.amount,
        });
      } else {
        matched.push({
          paymentId: ourPayment.id,
          providerTxId: providerTx.id,
        });
      }
    }

    // Check for payments we have but provider doesn't
    const providerTxIds = new Set(providerTransactions.map(tx => tx.id));
    const missingInProvider = ourPayments.filter(
      p => !providerTxIds.has(p.providerPaymentId),
    );

    for (const payment of missingInProvider) {
      unmatched.push({
        our: payment,
        reason: 'not_found_in_provider',
      });
    }

    // Calculate totals
    const expectedAmount = ourPayments.reduce((sum, p) => sum + p.amount, 0);
    const actualAmount = providerTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Create reconciliation record
    const reconciliation = this.reconciliationRepository.create({
      provider,
      reconciliationDate: date,
      totalTransactions: providerTransactions.length,
      matchedTransactions: matched.length,
      unmatchedTransactions: unmatched.length,
      expectedAmount,
      actualAmount,
      discrepancyAmount: expectedAmount - actualAmount,
      reportData: {
        matched,
        unmatched,
        discrepancies,
      },
      status: unmatched.length > 0 || discrepancies.length > 0 ? 'needs_review' : 'completed',
    });

    await this.reconciliationRepository.save(reconciliation);

    // Alert if there are issues
    if (reconciliation.status === 'needs_review') {
      await this.alertFinanceTeam(reconciliation);
    }

    return reconciliation;
  }

  private async fetchProviderTransactions(
    provider: string,
    date: Date,
  ): Promise<any[]> {
    if (provider === 'stripe') {
      return this.fetchStripeTransactions(date);
    } else if (provider === 'yookassa') {
      return this.fetchYooKassaTransactions(date);
    }
    return [];
  }

  private async fetchStripeTransactions(date: Date): Promise<any[]> {
    const stripe = this.stripeProvider.getStripeClient();
    const startTimestamp = Math.floor(date.getTime() / 1000);
    const endTimestamp = startTimestamp + 86400;

    const charges = await stripe.charges.list({
      created: {
        gte: startTimestamp,
        lt: endTimestamp,
      },
      limit: 100, // Paginate if needed
    });

    return charges.data.map(charge => ({
      id: charge.payment_intent,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      created: new Date(charge.created * 1000),
    }));
  }

  private async alertFinanceTeam(reconciliation: PaymentReconciliation): Promise<void> {
    // Send alert to finance team
    const message = `
Payment reconciliation needs review:
Provider: ${reconciliation.provider}
Date: ${reconciliation.reconciliationDate}
Unmatched: ${reconciliation.unmatchedTransactions}
Discrepancy: ${reconciliation.discrepancyAmount / 100} ${reconciliation.currency}
    `;

    await this.notificationService.sendAlert('finance@marketplace.com', 'Reconciliation Alert', message);
  }
}
```

---

## 📱 Frontend Components

### Payment Form Component
```tsx
// src/components/checkout/PaymentForm.tsx
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

function PaymentFormContent({ onSubmit, amount, currency }) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const card = elements.getElement(CardElement);

    // Create payment method
    const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card,
    });

    if (methodError) {
      setError(methodError.message);
      setProcessing(false);
      return;
    }

    // Submit to backend
    try {
      const result = await onSubmit(paymentMethod.id);
      
      if (result.requiresAction) {
        // Handle 3D Secure
        const { error: confirmError } = await stripe.confirmCardPayment(
          result.clientSecret
        );

        if (confirmError) {
          setError(confirmError.message);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('payment.cardDetails')}
        </label>
        <div className="p-3 border border-gray-300 rounded-md">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <span className="flex items-center justify-center">
            <Spinner className="mr-2" />
            {t('payment.processing')}
          </span>
        ) : (
          t('payment.pay', { amount: formatCurrency(amount, currency) })
        )}
      </button>
    </form>
  );
}

export function PaymentForm({ amount, currency, onSubmit }) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent amount={amount} currency={currency} onSubmit={onSubmit} />
    </Elements>
  );
}
```

---

## ✅ Sprint Checklist

### Backend
- [ ] Payment provider integrations
- [ ] Split payment calculation
- [ ] Escrow management
- [ ] Refund processing
- [ ] Payout scheduling
- [ ] Reconciliation system
- [ ] Webhook handlers

### Frontend
- [ ] Payment form UI
- [ ] 3D Secure handling
- [ ] Payment status display
- [ ] Refund request form

### Testing
- [ ] Payment flow E2E tests
- [ ] Webhook signature verification
- [ ] Idempotency tests
- [ ] Reconciliation accuracy

### Security
- [ ] PCI compliance check
- [ ] Encryption of sensitive data
- [ ] Webhook signature validation
- [ ] Rate limiting on payment endpoints

---

## 📈 Metrics

- Payment success rate: > 95%
- Average payment processing time: < 3s
- Reconciliation accuracy: 100%
- Payout on-time rate: > 99%

---

## 🔄 Next Sprint Preview

**Sprint 6: Bookings & Services**
- Service scheduling
- Availability calendar
- Booking confirmations
- Reminders

---

**Sprint 5 Complete: Payment system ready for transactions! 💰**