import { Row, Col } from 'react-bootstrap';
import { Product } from '@/types/catalog';
import { ProductCard } from '@/components/features/ProductCard';
import './ProductsGrid.css';

interface ProductsGridProps {
  products: Product[];
  viewMode?: 'grid' | 'list';
}

/**
 * Products grid/list display component
 */
export function ProductsGrid({ products, viewMode = 'grid' }: ProductsGridProps) {
  if (viewMode === 'list') {
    return (
      <div className="products-list">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} variant="list" />
        ))}
      </div>
    );
  }

  return (
    <Row className="products-grid g-4">
      {products.map((product) => (
        <Col key={product.id} xs={12} sm={6} lg={4} xl={3}>
          <ProductCard product={product} variant="grid" />
        </Col>
      ))}
    </Row>
  );
}
