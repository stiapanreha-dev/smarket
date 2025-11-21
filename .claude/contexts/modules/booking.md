# Booking Module

Service appointment scheduling for service-type products.

## Purpose

Manages bookings for service products (e.g., consultations, appointments, sessions).

## Key Features

- Schedule service appointments
- Booking time slot management
- Integration with Orders module (service FSM flow)
- Calendar availability
- Booking reminders

## Service Order Flow

```
PENDING → PAYMENT_CONFIRMED → BOOKING_CONFIRMED → REMINDER_SENT → IN_PROGRESS → COMPLETED
         ↓                    ↓                   ↓                ↓
         CANCELLED            CANCELLED           CANCELLED        NO_SHOW
```

## Key Entities

- `Booking` - Appointment details
- `TimeSlot` - Available booking slots
- `BookingStatus` - Booking state

## Integration Points

- **Orders Module**: Service orders trigger booking creation
- **Notification Module**: Sends booking reminders
- **Calendar**: External calendar sync (if implemented)

## Typical Flow

1. Customer purchases service product
2. Order status → BOOKING_CONFIRMED
3. Booking record created with scheduled time
4. Reminder sent before appointment
5. Service provider marks IN_PROGRESS
6. After completion → COMPLETED (or NO_SHOW)

## Related

- See `modules/orders.md` for order FSM flows
- See `modules/catalog.md` for service product types
