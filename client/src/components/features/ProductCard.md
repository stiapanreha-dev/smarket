# ProductCard Component

A fully-featured, responsive product card component for displaying products in the SnailMarketplace application.

## Features

- **Two Layout Variants**: Grid and List views
- **Multi-language Support**: Full i18n integration (EN, RU, AR)
- **RTL Support**: Automatic RTL layout for Arabic language
- **Product Types**: Physical, Service, and Course/Digital products
- **Rating Display**: Star rating with review count
- **Price Formatting**: Automatic currency formatting based on locale
- **Image Handling**: Automatic fallback to placeholder for missing images
- **Hover Effects**: Smooth animations and visual feedback
- **Responsive Design**: Bootstrap-based responsive layout
- **Click Navigation**: Navigate to product detail page on card click
- **Type-specific Actions**: "Add to Cart" for products, "Book Now" for services

## Usage

### Basic Usage (Grid Layout)

```tsx
import { ProductCard } from '@/components/features';
import { Product } from '@/types/catalog';

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="row g-4">
      {products.map(product => (
        <div key={product.id} className="col-md-4">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
```

### List Layout

```tsx
import { ProductCard } from '@/components/features';

function ProductList({ products }: { products: Product[] }) {
  return (
    <div>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          variant="list"
        />
      ))}
    </div>
  );
}
```

### Responsive Layout (Grid on Desktop, List on Mobile)

```tsx
import { ProductCard } from '@/components/features';
import { Container, Row, Col } from 'react-bootstrap';

function ResponsiveProducts({ products }: { products: Product[] }) {
  return (
    <Container>
      {/* Desktop: Grid Layout */}
      <div className="d-none d-lg-block">
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {products.map(product => (
            <Col key={product.id}>
              <ProductCard product={product} variant="grid" />
            </Col>
          ))}
        </Row>
      </div>

      {/* Mobile: List Layout */}
      <div className="d-lg-none">
        {products.map(product => (
          <ProductCard key={product.id} product={product} variant="list" />
        ))}
      </div>
    </Container>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `product` | `Product` | **required** | Product object containing all product information |
| `variant` | `'grid' \| 'list'` | `'grid'` | Layout variant for the card |

## Product Type

The component expects a `Product` object with the following structure:

```typescript
interface Product {
  id: string;
  merchant_id: string;
  type: ProductType; // PHYSICAL, SERVICE, or COURSE
  title: string;
  description: string | null;
  slug: string | null;
  status: ProductStatus;
  base_price_minor: number | null; // Price in cents
  base_price: number | null; // Price in dollars
  currency: string;
  image_url: string | null;
  images: string[] | null;
  view_count: number;
  sales_count: number;
  rating: number | null; // 0-5 rating
  review_count: number;
  // ... other fields
}
```

## Internationalization

The component uses the following translation keys:

### English (en)
```json
{
  "product": {
    "type": {
      "physical": "Physical",
      "service": "Service",
      "course": "Digital"
    },
    "addToCart": "Add to Cart",
    "bookNow": "Book Now",
    "sold": "{{count}} sold"
  }
}
```

### Russian (ru)
```json
{
  "product": {
    "type": {
      "physical": "Физический",
      "service": "Услуга",
      "course": "Цифровой"
    },
    "addToCart": "В корзину",
    "bookNow": "Забронировать",
    "sold": "Продано: {{count}}"
  }
}
```

### Arabic (ar)
```json
{
  "product": {
    "type": {
      "physical": "مادي",
      "service": "خدمة",
      "course": "رقمي"
    },
    "addToCart": "أضف إلى السلة",
    "bookNow": "احجز الآن",
    "sold": "تم البيع: {{count}}"
  }
}
```

## Styling

The component includes comprehensive CSS styling in `ProductCard.css` with:

- Smooth hover transitions
- Responsive breakpoints
- RTL support
- Custom color variables from the design system
- Grid and list variant-specific styles

### CSS Variables Used

```css
--main-color: #7FB3D5
--main-dark: #5A9AC4
--text-primary: #2C3E50
--text-secondary: #7F8C8D
--border-color: #D6E4EC
```

## Image Handling

The component handles images with the following priority:

1. `product.image_url` - Primary product image
2. `product.images[0]` - First image from images array
3. `/placeholder-product.svg` - Fallback placeholder

The placeholder SVG is automatically used when:
- No image URL is provided
- Image fails to load (handled via `onError` event)

## Navigation

Clicking on a product card navigates to `/catalog/:id` where `:id` is the product ID. The navigation is prevented when clicking on the action button to avoid conflicts.

## Behavior

### Grid Variant
- Square image with 1:1 aspect ratio
- Product type badge positioned in top-right corner (top-left for RTL)
- Title truncated to 60 characters (2 lines max)
- Star rating display
- Price prominently displayed
- Full-width action button at bottom

### List Variant
- Horizontal layout with image on left (right for RTL)
- Larger title limit (80 characters)
- Description preview (150 characters)
- Rating and sales count displayed inline
- Action button positioned on the right (left for RTL)

## RTL Support

When the language is set to Arabic (`i18n.language === 'ar'`):
- Component direction automatically switches to RTL
- Text alignment adjusts to right-aligned
- Flex layouts reverse direction
- Badges and buttons reposition appropriately

## Browser Support

- Modern browsers with ES6+ support
- React 19.2+
- Bootstrap 5.3+
- Responsive design works on all viewport sizes

## Accessibility

The component includes:
- Semantic HTML structure
- Alt text for images
- Keyboard-accessible buttons
- Screen reader-friendly content
- ARIA-compliant Bootstrap components

## Examples

See `ProductCard.example.tsx` for comprehensive usage examples including:
- Grid layout
- List layout
- Mixed layouts
- Responsive implementations

## Future Enhancements

Potential improvements for future versions:
- Wishlist/favorite button
- Quick view modal
- Add to cart quantity selector
- Stock availability indicator
- Discount percentage badge
- Multiple image carousel
- Video thumbnail support
- Skeleton loading state
