# Notification Module

Multi-channel notification system (email, future: SMS, push).

## Purpose

Sends notifications to users about order updates, payment confirmations, booking reminders, and promotional content.

## Notification Types

```typescript
enum NotificationType {
  ORDER_UPDATE = 'ORDER_UPDATE',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  SHIPPING_UPDATE = 'SHIPPING_UPDATE',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  PROMO = 'PROMO',
}
```

## Channels

### Currently Implemented
- **Email** - Primary notification channel

### Future Implementation
- **SMS** - For urgent notifications
- **Push Notifications** - Mobile/web push
- **In-App** - Notification center

## Email Templates

Email templates support multi-language (EN/RU/AR):
- Order confirmation
- Payment receipt
- Shipping updates
- Booking reminders
- Password reset

## Event-Driven Notifications

Notifications triggered by events from outbox pattern:

```typescript
// Listen for order events
@OnEvent('order.payment_confirmed')
async handlePaymentConfirmed(event: OrderPaymentConfirmedEvent) {
  await this.notificationService.send({
    type: NotificationType.PAYMENT_SUCCESS,
    recipient: event.customer_email,
    data: {
      order_id: event.order_id,
      amount: event.amount,
    },
  });
}
```

## Notification Preferences

Users can control notification preferences:
- Email notifications on/off
- Notification types to receive
- Language preference

## Key Files

- `notification.service.ts` - Core notification logic
- `email.service.ts` - Email sending (SMTP/SendGrid)
- `templates/` - Email templates (Handlebars)

## Integration Points

- **Orders Module**: Order status notifications
- **Payment Module**: Payment confirmations
- **Booking Module**: Appointment reminders
- **Auth Module**: Password reset, verification

## Related

- See `modules/orders.md` for order events
- See `architecture/events-outbox.md` for event handling
