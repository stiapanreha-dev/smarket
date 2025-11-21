# CSS and Layout Patterns

## Fixed Navbar Pattern - CRITICAL

The navbar uses Bootstrap's `fixed="top"` which requires special handling.

### The Problem

Fixed navbar overlays page content, hiding the top portion.

### The Solution

**All page-level containers must include `padding-top: 80px`**

```css
.my-page {
  padding-top: 80px; /* Account for fixed navbar */
  min-height: calc(100vh - 200px);
}
```

### Pages That Need This

**Customer Pages:**
- CatalogPage
- ProductPage
- CartPage
- CheckoutPage
- ProfilePage
- OrdersPage
- OrderDetailsPage
- WishlistPage
- NotificationsPage
- SearchPage

**Merchant Pages:**
- DashboardPage
- ProductsPage
- OrdersPage
- AnalyticsPage
- SettingsPage

### Component Structure

```typescript
const CatalogPage = () => {
  return (
    <div className="catalog-page"> {/* ← Add padding-top: 80px here */}
      <Container>
        <h1>Product Catalog</h1>
        {/* content */}
      </Container>
    </div>
  );
};
```

```css
/* CatalogPage.css */
.catalog-page {
  padding-top: 80px; /* Critical! */
  min-height: calc(100vh - 200px);
}
```

## Bootstrap 5 Integration

Using React Bootstrap components:

```typescript
import { Container, Row, Col, Button } from 'react-bootstrap';

<Container>
  <Row>
    <Col md={8}>
      <Button variant="primary">Click me</Button>
    </Col>
  </Row>
</Container>
```

## Responsive Design

Use Bootstrap's responsive classes:

```typescript
<Row>
  <Col xs={12} md={6} lg={4}>
    {/* Full width mobile, half on tablet, third on desktop */}
  </Col>
</Row>
```

## RTL Support (Arabic)

For Arabic locale, add RTL support:

```css
[dir='rtl'] .my-component {
  text-align: right;
  direction: rtl;
}
```

React Bootstrap automatically handles RTL for most components.

## Common Layout Issues

**Content hidden behind navbar:**
- Add `padding-top: 80px` to page container

**Page too short:**
- Add `min-height: calc(100vh - 200px)` for full-height pages

**Horizontal scroll:**
- Check for fixed-width elements
- Use `max-width: 100%` on images

## Related

- See official React Bootstrap docs: https://react-bootstrap.github.io/
- See `frontend/i18n.md` for RTL language support
