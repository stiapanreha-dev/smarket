import { Card, Badge, Button, Row, Col } from 'react-bootstrap';
import { format } from 'date-fns';
import {
  type Order,
  OrderStatus,
  formatOrderTotal,
  getOrderStatusText,
} from '@/types';

export interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

/**
 * Get badge variant based on order status
 */
function getStatusBadgeVariant(status: OrderStatus): 'primary' | 'success' | 'warning' | 'danger' | 'secondary' {
  switch (status) {
    case OrderStatus.COMPLETED:
      return 'success';
    case OrderStatus.PROCESSING:
    case OrderStatus.CONFIRMED:
      return 'primary';
    case OrderStatus.PENDING:
      return 'warning';
    case OrderStatus.CANCELLED:
      return 'danger';
    case OrderStatus.REFUNDED:
    case OrderStatus.PARTIALLY_REFUNDED:
      return 'secondary';
    default:
      return 'secondary';
  }
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
 */
export function OrderCard({ order, onClick }: OrderCardProps) {
  // Get product thumbnails from line items
  const lineItems = order.line_items || [];
  const maxThumbnails = 3;
  const visibleItems = lineItems.slice(0, maxThumbnails);
  const remainingCount = lineItems.length - maxThumbnails;

  // Format date
  const orderDate = format(new Date(order.created_at), 'MMM dd, yyyy');

  // Format total
  const total = formatOrderTotal(order);

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
                <Badge bg={getStatusBadgeVariant(order.status)} pill>
                  {getOrderStatusText(order.status)}
                </Badge>
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
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              View Details
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

export default OrderCard;
