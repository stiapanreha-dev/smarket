import { memo } from 'react';
// TODO: Fix react-window imports - temporarily disabled
// import { FixedSizeGrid, GridChildComponentProps } from 'react-window';
import type { Product } from '@/types/catalog';
import { ProductCard } from '@/components/features/ProductCard';
import './ProductsGrid.css';

interface VirtualizedProductsGridProps {
  products: Product[];
  containerWidth?: number;
}

/**
 * Virtualized Products Grid Component
 * Temporarily using regular grid until react-window import is fixed
 */
function VirtualizedProductsGridComponent({
  products,
}: VirtualizedProductsGridProps) {
  // Temporary fallback to regular grid
  return (
    <div className="row g-3">
      {products.map((product) => (
        <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
          <ProductCard product={product} variant="grid" />
        </div>
      ))}
    </div>
  );
}

export const VirtualizedProductsGrid = memo(VirtualizedProductsGridComponent);
