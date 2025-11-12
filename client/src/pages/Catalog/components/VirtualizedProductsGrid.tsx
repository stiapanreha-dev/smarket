import { memo, useRef, useEffect } from 'react';
import { FixedSizeGrid, GridChildComponentProps } from 'react-window';
import { Product } from '@/types/catalog';
import { ProductCard } from '@/components/features/ProductCard';
import './ProductsGrid.css';

interface VirtualizedProductsGridProps {
  products: Product[];
  containerWidth?: number;
}

/**
 * Virtualized Products Grid Component
 * Uses react-window for efficient rendering of large product lists
 * Only renders visible items + buffer, greatly improving performance
 */
function VirtualizedProductsGridComponent({
  products,
  containerWidth = 1200
}: VirtualizedProductsGridProps) {
  const gridRef = useRef<FixedSizeGrid>(null);

  // Responsive column calculation
  const getColumnCount = (width: number): number => {
    if (width >= 1400) return 4; // XL
    if (width >= 992) return 3;  // LG
    if (width >= 576) return 2;  // SM
    return 1;                    // XS
  };

  const columnCount = getColumnCount(containerWidth);
  const columnWidth = containerWidth / columnCount;
  const rowHeight = 400; // Approximate height of ProductCard
  const rowCount = Math.ceil(products.length / columnCount);

  // Reset scroll when products change
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollTo({ scrollTop: 0 });
    }
  }, [products]);

  // Cell renderer
  const Cell = ({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
    const index = rowIndex * columnCount + columnIndex;

    if (index >= products.length) {
      return null;
    }

    const product = products[index];

    return (
      <div style={{ ...style, padding: '12px' }}>
        <ProductCard product={product} variant="grid" />
      </div>
    );
  };

  return (
    <FixedSizeGrid
      ref={gridRef}
      className="products-grid-virtualized"
      columnCount={columnCount}
      columnWidth={columnWidth}
      height={Math.min(800, window.innerHeight - 200)} // Max height with viewport consideration
      rowCount={rowCount}
      rowHeight={rowHeight}
      width={containerWidth}
      overscanRowCount={1} // Render 1 extra row above/below for smooth scrolling
    >
      {Cell}
    </FixedSizeGrid>
  );
}

export const VirtualizedProductsGrid = memo(VirtualizedProductsGridComponent);
