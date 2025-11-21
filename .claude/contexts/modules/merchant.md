# Merchant Module

Merchant profiles, dashboards, and seller management.

## Purpose

Enables sellers to manage their products, orders, and payouts on the marketplace.

## Key Features

- Merchant registration and profiles
- Product management dashboard
- Order fulfillment interface
- Sales analytics
- Payout tracking

## Merchant Dashboard

Merchants have access to:
- Product listings (CRUD operations)
- Incoming orders
- Sales statistics
- Payout history
- Customer reviews (future)

## Merchant vs Customer Roles

- **Customer**: Regular users who purchase products
- **Merchant**: Sellers who list and sell products

A user can be both a customer and a merchant.

## Merchant Endpoints

```typescript
// Protected merchant-only endpoints
@UseGuards(MerchantGuard)
@Controller('merchant')
export class MerchantController {
  @Get('dashboard')
  async getDashboard(@CurrentUser() user: User) {
    // Merchant dashboard data
  }

  @Get('orders')
  async getOrders(@CurrentUser() user: User) {
    // Orders for merchant's products
  }
}
```

## Integration Points

- **User Module**: User with merchant role
- **Catalog Module**: Merchant product management
- **Orders Module**: Order fulfillment
- **Payout Module**: Earning disbursements

## Merchant Onboarding

1. User registers as merchant
2. Merchant profile created
3. Payment account setup (for payouts)
4. Start listing products

## Related

- See `modules/user.md` for user roles
- See `modules/payout.md` for merchant earnings
- See `modules/catalog.md` for product management
