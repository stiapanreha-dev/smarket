# User Module

User management with locale/currency preferences and roles.

## User Profile

User entity includes:
- Basic info (name, email, phone)
- Preferences (locale, currency)
- Roles (customer, merchant, admin)
- Addresses
- Created/updated timestamps

## Multi-Language Support

Users can set preferred locale:
- **EN** - English
- **RU** - Russian (Cyrillic)
- **AR** - Arabic (RTL support)

Locale affects:
- UI language
- Email templates
- Product descriptions

## Currency Preferences

Users can set preferred currency:
- USD, EUR, RUB, AED
- Prices displayed in preferred currency
- Converted at current exchange rates

## User Roles

```typescript
enum UserRole {
  CUSTOMER = 'CUSTOMER',
  MERCHANT = 'MERCHANT',
  ADMIN = 'ADMIN',
}
```

Users can have multiple roles:
- Customer + Merchant (can buy and sell)
- Admin (platform management)

## User Addresses

Users can save multiple addresses:
- Shipping addresses
- Billing addresses
- Default address flag

## Key Endpoints

```typescript
// Get current user profile
GET /users/me

// Update profile
PATCH /users/me
Body: { locale: 'ru', currency: 'RUB' }

// Get user addresses
GET /users/me/addresses

// Add address
POST /users/me/addresses
```

## Integration Points

- **Auth Module**: User authentication
- **Merchant Module**: Merchant role management
- **Orders Module**: User order history
- **Cart Module**: User cart (vs guest cart)

## Related

- See `modules/auth.md` for authentication
- See `modules/merchant.md` for merchant roles
- See `frontend/i18n.md` for multi-language implementation
