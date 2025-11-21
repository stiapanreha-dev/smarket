# Payment Module

Payment processing with provider abstraction supporting multiple payment gateways.

## Supported Providers

- **Stripe** - International payments
- **Yookassa** - Russian market
- **PayPal** - (future)
- **Crypto** - (future)

## Provider Abstraction

Payment providers implement a common interface:

```typescript
interface IPaymentProvider {
  createPaymentIntent(data: CreatePaymentIntentDto): Promise<PaymentIntent>;
  confirmPayment(intentId: string): Promise<PaymentResult>;
  refund(intentId: string, amount?: number): Promise<RefundResult>;
  getPaymentStatus(intentId: string): Promise<PaymentStatus>;
}
```

## Payment Flow

1. **Checkout Confirmed** - User finalizes checkout
2. **Payment Intent Created** - Provider-specific payment intent
3. **User Pays** - Frontend redirects to payment page
4. **Webhook Received** - Provider sends confirmation webhook
5. **Payment Confirmed** - Order status → PAYMENT_CONFIRMED
6. **Order Created** - Full order processing begins

## Webhook Handling

Payment providers send webhooks for payment events:

```typescript
@Public()
@Post('webhooks/:provider')
async handleWebhook(
  @Param('provider') provider: string,
  @Body() payload: any,
  @Headers('stripe-signature') signature: string,
) {
  // Verify webhook signature
  const event = this.paymentService.verifyWebhook(provider, payload, signature);

  // Process payment event
  if (event.type === 'payment_intent.succeeded') {
    await this.orderService.confirmPayment(event.payment_intent_id);
  }
}
```

## Split Payments

For marketplace model, payments split between:
- **Platform fee** - Marketplace commission
- **Merchant payout** - Seller earnings

```typescript
const platformFee = orderTotal * PLATFORM_FEE_PERCENTAGE;
const merchantPayout = orderTotal - platformFee;
```

## Multi-Currency

Supports multiple currencies:
- USD, EUR, RUB, AED
- Currency conversion handled by payment providers
- Prices stored in base currency

## Key Files

- `payment.service.ts` - Payment orchestration
- `providers/stripe.provider.ts` - Stripe integration
- `providers/yookassa.provider.ts` - Yookassa integration
- `payment-intent.entity.ts` - Payment intent records

## Detailed Documentation

See `/src/modules/payment/README.md` for comprehensive payment documentation.

## Security

- Webhook signatures verified
- Payment intents have short expiry
- PCI compliance (providers handle card data)
- No card data stored locally

## Related

- See `modules/checkout.md` for checkout flow
- See `modules/orders.md` for order creation
- See `modules/payout.md` for merchant disbursements
