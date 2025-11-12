import { memo, useRef, useEffect } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { type Order } from '@/types';
import { OrderCard } from './OrderCard';

interface VirtualizedOrdersListProps {
  orders: Order[];
  onOrderClick: (orderId: string) => void;
  containerHeight?: number;
}

/**
 * Virtualized Orders List Component
 * Uses react-window for efficient rendering of large order lists
 * Only renders visible items + buffer, greatly improving performance
 */
function VirtualizedOrdersListComponent({
  orders,
  onOrderClick,
  containerHeight = 800
}: VirtualizedOrdersListProps) {
  const listRef = useRef<FixedSizeList>(null);

  const itemHeight = 200; // Approximate height of OrderCard

  // Reset scroll when orders change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo(0);
    }
  }, [orders]);

  // Row renderer
  const Row = ({ index, style }: ListChildComponentProps) => {
    const order = orders[index];

    return (
      <div style={{ ...style, paddingBottom: '12px' }}>
        <OrderCard
          order={order}
          onClick={() => onOrderClick(order.id)}
        />
      </div>
    );
  };

  return (
    <FixedSizeList
      ref={listRef}
      className="orders-list-virtualized"
      height={Math.min(containerHeight, window.innerHeight - 300)}
      itemCount={orders.length}
      itemSize={itemHeight}
      width="100%"
      overscanCount={2} // Render 2 extra items above/below for smooth scrolling
    >
      {Row}
    </FixedSizeList>
  );
}

export const VirtualizedOrdersList = memo(VirtualizedOrdersListComponent);
