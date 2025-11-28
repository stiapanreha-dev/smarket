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

## Color Scheme

The project uses a custom light blue color scheme instead of Bootstrap's default blue.

### Color Palette

| Variable | Hex | RGB | Usage |
|----------|-----|-----|-------|
| `--main-color` | `#7FB3D5` | `127, 179, 213` | Primary brand color |
| `--main-dark` | `#5A9AC4` | `90, 154, 196` | Hover states, emphasis |
| `--main-light` | `#A4C9E0` | `164, 201, 224` | Backgrounds, accents |
| `--main-darker` | `#4A8AB4` | `74, 138, 180` | Active/pressed states |

### Bootstrap Variable Overrides

Bootstrap's primary color is overridden in `client/src/styles/custom.css`:

```css
:root {
  /* Custom color palette */
  --main-color: #7FB3D5;
  --main-dark: #5A9AC4;
  --main-light: #A4C9E0;

  /* Override Bootstrap primary color */
  --bs-primary: #7FB3D5;
  --bs-primary-rgb: 127, 179, 213;
  --bs-link-color: #7FB3D5;
  --bs-link-hover-color: #5A9AC4;
}

/* Button overrides */
.btn-primary {
  --bs-btn-bg: #7FB3D5;
  --bs-btn-border-color: #7FB3D5;
  --bs-btn-hover-bg: #5A9AC4;
  --bs-btn-hover-border-color: #5A9AC4;
  --bs-btn-active-bg: #4A8AB4;
  --bs-btn-active-border-color: #4A8AB4;
}
```

### Usage Guidelines

**Always use CSS variables or the brand hex values:**

```css
/* ✅ CORRECT - Use CSS variable */
.my-element {
  color: var(--main-color);
  border-color: var(--main-dark);
}

/* ✅ CORRECT - Use brand hex when variable not available */
.my-element {
  color: #7FB3D5;
}

/* ❌ WRONG - Never use Bootstrap default blue */
.my-element {
  color: #0d6efd;  /* Bootstrap default - DON'T USE */
}
```

**For React Bootstrap components:**

```typescript
// ✅ CORRECT - variant="primary" uses our overridden color
<Button variant="primary">Submit</Button>
<Badge bg="primary">New</Badge>

// ✅ CORRECT - Inline style with brand color
<div style={{ color: '#7FB3D5' }}>Accent text</div>
```

### Files with Color Overrides

- `client/src/styles/custom.css` - Main Bootstrap overrides
- Individual page CSS files use `#7FB3D5` for consistency

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
