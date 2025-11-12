import { Card, Button, Row, Col } from 'react-bootstrap';
import { format } from 'date-fns';
import { memo, useMemo, useCallback } from 'react';
import {
  type Order,
  formatOrderTotal,
} from '@/types';
import { OrderStatusBadge } from '@/components/features/OrderStatusBadge';

export interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

/**
 * OrderCard Component
 *
 * Displays a summary card for an order with:
 * - Order number and date
 * - Status badge
 * - Product thumbnails (max 3, with +N indicator)
 * - Total amount
 * - View Details button
 * Optimized with React.memo to prevent unnecessary re-renders
 */
function OrderCardComponent({ order, onClick }: OrderCardProps) {
  // Get product thumbnails from line items - memoized
  const lineItems = useMemo(() => order.line_items || [], [order.line_items]);
  const maxThumbnails = 3;
  const visibleItems = useMemo(() => lineItems.slice(0, maxThumbnails), [lineItems]);
  const remainingCount = useMemo(() => lineItems.length - maxThumbnails, [lineItems.length]);

  // Format date - memoized
  const orderDate = useMemo(() => format(new Date(order.created_at), 'MMM dd, yyyy'), [order.created_at]);

  // Format total - memoized
  const total = useMemo(() => formatOrderTotal(order), [order]);

  // Handle click - memoized with useCallback
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  return (
    <Card className="order-card mb-3" onClick={onClick} style={{ cursor: 'pointer' }}>
      <Card.Body>
        <Row>
          {/* Left side: Order info */}
          <Col xs={12} md={8} className="d-flex flex-column justify-content-between">
            <div>
              {/* Order number and date */}
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h5 className="mb-1 order-card__number">
                    Order #{order.order_number}
                  </h5>
                  <p className="text-muted mb-0 small">
                    {orderDate}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} size="sm" />
              </div>

              {/* Product thumbnails */}
              <div className="order-card__thumbnails d-flex align-items-center mt-3 mb-2">
                {visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className="order-card__thumbnail"
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginRight: '8px',
                      border: '1px solid #dee2e6',
                      backgroundColor: '#f8f9fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product_name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <span className="text-muted">📦</span>
                    )}
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div
                    className="order-card__thumbnail-more"
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      border: '1px solid #dee2e6',
                      backgroundColor: '#f8f9fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: '#6c757d',
                    }}
                  >
                    +{remainingCount}
                  </div>
                )}
              </div>

              {/* Item count */}
              <p className="text-muted mb-0 small">
                {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </Col>

          {/* Right side: Total and action */}
          <Col xs={12} md={4} className="d-flex flex-column justify-content-between align-items-end mt-3 mt-md-0">
            <div className="text-end mb-2">
              <p className="text-muted mb-1 small">Total Amount</p>
              <h4 className="mb-0 order-card__total">
                {order.currency} {total.toFixed(2)}
              </h4>
            </div>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleClick}
            >
              View Details
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const OrderCard = memo(OrderCardComponent);
export default OrderCard;
