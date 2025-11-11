/**
 * ProductCard Component Usage Examples
 *
 * This file demonstrates how to use the ProductCard component
 * in different scenarios and layouts.
 */

import { Container, Row, Col } from 'react-bootstrap';
import { ProductCard } from './ProductCard';
import type { Product } from '@/types/catalog';
import { ProductType, ProductStatus } from '@/types/catalog';

// Example product data
const exampleProducts: Product[] = [
  {
    id: '1',
    merchant_id: 'merchant-1',
    type: ProductType.PHYSICAL,
    title: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    slug: 'premium-wireless-headphones',
    status: ProductStatus.ACTIVE,
    base_price_minor: 19999, // $199.99
    base_price: 199.99,
    currency: 'USD',
    attrs: {
      brand: 'AudioTech',
      color: 'Black',
    },
    image_url: 'https://example.com/headphones.jpg',
    images: ['https://example.com/headphones.jpg'],
    view_count: 1250,
    sales_count: 45,
    rating: 4.5,
    review_count: 28,
    seo: null,
    published_at: '2024-01-01T00:00:00Z',
    metadata: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_published: true,
    is_physical: true,
    is_service: false,
    is_course: false,
  },
  {
    id: '2',
    merchant_id: 'merchant-2',
    type: ProductType.SERVICE,
    title: 'Professional Haircut & Styling',
    description: 'Expert haircut and styling service by certified professionals',
    slug: 'professional-haircut-styling',
    status: ProductStatus.ACTIVE,
    base_price_minor: 5000, // $50.00
    base_price: 50.00,
    currency: 'USD',
    attrs: null,
    image_url: null,
    images: null,
    view_count: 890,
    sales_count: 156,
    rating: 4.8,
    review_count: 89,
    seo: null,
    published_at: '2024-01-01T00:00:00Z',
    metadata: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_published: true,
    is_physical: false,
    is_service: true,
    is_course: false,
  },
  {
    id: '3',
    merchant_id: 'merchant-3',
    type: ProductType.COURSE,
    title: 'Complete Web Development Bootcamp 2024',
    description: 'Learn full-stack web development from scratch',
    slug: 'web-development-bootcamp-2024',
    status: ProductStatus.ACTIVE,
    base_price_minor: 12999, // $129.99
    base_price: 129.99,
    currency: 'USD',
    attrs: {
      category: ['Education', 'Technology'],
    },
    image_url: 'https://example.com/bootcamp.jpg',
    images: ['https://example.com/bootcamp.jpg'],
    view_count: 3420,
    sales_count: 234,
    rating: 4.9,
    review_count: 178,
    seo: null,
    published_at: '2024-01-01T00:00:00Z',
    metadata: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_published: true,
    is_physical: false,
    is_service: false,
    is_course: true,
  },
];

/**
 * Grid Layout Example
 *
 * Default variant showing products in a grid layout.
 * Typically used in product listing pages.
 */
export function GridLayoutExample() {
  return (
    <Container className="my-5">
      <h2 className="mb-4">Grid Layout (Default)</h2>
      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {exampleProducts.map((product) => (
          <Col key={product.id}>
            <ProductCard product={product} variant="grid" />
          </Col>
        ))}
      </Row>
    </Container>
  );
}

/**
 * List Layout Example
 *
 * List variant showing products in a vertical list layout.
 * Typically used in search results or filtered views.
 */
export function ListLayoutExample() {
  return (
    <Container className="my-5">
      <h2 className="mb-4">List Layout</h2>
      {exampleProducts.map((product) => (
        <ProductCard key={product.id} product={product} variant="list" />
      ))}
    </Container>
  );
}

/**
 * Mixed Layout Example
 *
 * Combining both grid and list layouts based on viewport or user preference.
 */
export function MixedLayoutExample() {
  return (
    <Container className="my-5">
      <h2 className="mb-4">Featured Products (Grid)</h2>
      <Row xs={1} sm={2} md={3} className="g-4 mb-5">
        {exampleProducts.slice(0, 3).map((product) => (
          <Col key={product.id}>
            <ProductCard product={product} variant="grid" />
          </Col>
        ))}
      </Row>

      <h2 className="mb-4">Recent Products (List)</h2>
      {exampleProducts.map((product) => (
        <ProductCard key={product.id} product={product} variant="list" />
      ))}
    </Container>
  );
}

/**
 * Responsive Example
 *
 * Shows how ProductCard adapts to different screen sizes.
 * Grid on large screens, list on small screens (handled by parent component).
 */
export function ResponsiveExample() {
  return (
    <Container className="my-5">
      <h2 className="mb-4">Responsive Layout</h2>

      {/* Desktop: Grid Layout */}
      <div className="d-none d-lg-block">
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {exampleProducts.map((product) => (
            <Col key={product.id}>
              <ProductCard product={product} variant="grid" />
            </Col>
          ))}
        </Row>
      </div>

      {/* Mobile: List Layout */}
      <div className="d-lg-none">
        {exampleProducts.map((product) => (
          <ProductCard key={product.id} product={product} variant="list" />
        ))}
      </div>
    </Container>
  );
}

export default GridLayoutExample;
