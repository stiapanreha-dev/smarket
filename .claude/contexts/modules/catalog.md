# Catalog Module

Product catalog management supporting three product types: physical goods, digital products, and services.

## Product Types

### 1. Physical Products
- Tangible goods requiring shipping
- Stock/inventory management
- Shipping address required
- FSM flow: PENDING → PAYMENT → PREPARING → SHIPPED → DELIVERED

### 2. Digital Products
- Downloadable content (ebooks, software, media)
- Instant delivery after payment
- No inventory management needed
- FSM flow: PENDING → PAYMENT → ACCESS_GRANTED → DOWNLOADED

### 3. Service Products
- Appointments, consultations, sessions
- Booking/scheduling required
- Time slot management
- FSM flow: PENDING → PAYMENT → BOOKING_CONFIRMED → COMPLETED

## Key Features

- Multi-language support (EN/RU/AR)
- Product variants (size, color, etc.)
- Categories and tags
- Search and filtering
- EditorJS-based descriptions

## Product Fields

- `name` - Translatable product name
- `description` - EditorJS format (rich text)
- `price` - Base price
- `currency` - Multi-currency support
- `product_type` - PHYSICAL | DIGITAL | SERVICE
- `merchant_id` - Seller reference
- `stock` - For physical products only

## EditorJS Descriptions

Product descriptions use EditorJS format for rich content.

**Extract plain text for previews:**
```typescript
import { extractTextFromEditorJS } from '@/utils/editorjs';

const preview = extractTextFromEditorJS(product.description, 150);
```

## Multi-Language

Products support translations for:
- EN (English)
- RU (Russian)
- AR (Arabic with RTL support)

Translation fields stored in JSONB columns.

## Public Endpoints

Most catalog endpoints are public:
```typescript
@Public()
@Get('products')
async getProducts() {
  // Public catalog access
}
```

## Related

- See `modules/inventory.md` for stock management
- See `modules/booking.md` for service scheduling
- See `frontend/i18n.md` for multi-language support
