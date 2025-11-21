# Payout Module

Merchant payout management and earnings disbursement.

## Purpose

Manages merchant earnings from sales and schedules payouts to merchant accounts.

## Payout Cycle

1. **Sale Completed** - Order reaches DELIVERED/COMPLETED status
2. **Earnings Accumulated** - Merchant balance updated
3. **Payout Scheduled** - Monthly/weekly payout schedule
4. **Payout Processed** - Transfer to merchant bank account
5. **Payout Confirmed** - Status updated, merchant notified

## Payout Calculation

```typescript
// For each completed order
const platformFee = orderTotal * PLATFORM_FEE_PERCENTAGE;
const merchantEarnings = orderTotal - platformFee - transactionFees;

// Add to merchant balance
await this.payoutService.addEarnings(merchantId, merchantEarnings);
```

## Platform Fee

Marketplace takes commission from each sale:
- Configurable percentage (e.g., 10-15%)
- Deducted before merchant payout
- Transaction fees also deducted

## Payout Schedule

- **Weekly**: Every Monday
- **Monthly**: 1st of each month
- **Threshold-based**: When balance reaches minimum (e.g., $100)

## Payout Status

```typescript
enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
```

## Hold Period

Earnings held for security (e.g., 7-14 days):
- Protects against refunds/chargebacks
- Ensures product delivery confirmed
- Configurable per merchant

## Merchant Dashboard

Merchants can view:
- Current balance
- Upcoming payouts
- Payout history
- Fee breakdown
- Sales analytics

## Integration Points

- **Orders Module**: Triggers earnings on order completion
- **Payment Module**: Processes payout transfers
- **Merchant Module**: Merchant balance display
- **Notification Module**: Payout notifications

## Key Files

- `payout.service.ts` - Payout logic
- `payout.entity.ts` - Payout records
- `merchant-balance.entity.ts` - Merchant earnings

## Related

- See `modules/merchant.md` for merchant management
- See `modules/payment.md` for payment processing
- See `modules/orders.md` for order completion
