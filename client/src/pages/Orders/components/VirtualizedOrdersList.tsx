import { memo } from 'react';
// TODO: Fix react-window imports - temporarily disabled
import { type Order } from '@/types';
import { OrderCard } from './OrderCard';

interface VirtualizedOrdersListProps {
  orders: Order[];
  containerHeight?: number;
}

/**
 * Virtualized Orders List Component
 * Temporarily using regular list until react-window import is fixed
 */
function VirtualizedOrdersListComponent({
  orders,
}: VirtualizedOrdersListProps) {
  // Temporary fallback to regular list
  return (
    <div className="orders-list">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

export const VirtualizedOrdersList = memo(VirtualizedOrdersListComponent);
