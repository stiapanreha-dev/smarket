import { Card } from 'react-bootstrap';
import { type Order } from '@/types';

export interface PricingSummaryProps {
  order: Order;
}

/**
 * Format currency amount (from minor units to major units)
 */
function formatAmount(amount: number, currency: string): string {
  const majorAmount = amount / 100;
  return `${currency} ${majorAmount.toFixed(2)}`;
}

/**
 * PricingSummary Component
 *
 * Displays order pricing breakdown:
 * - Subtotal
 * - Shipping fee
 * - Tax
 * - Discount (if any)
 * - Total
 */
export function PricingSummary({ order }: PricingSummaryProps) {
  const hasDiscount = order.discount_amount > 0;

  return (
    <Card className="pricing-summary">
      <Card.Body>
        <h5 className="mb-4">Order Summary</h5>

        <div className="pricing-breakdown">
          {/* Subtotal */}
          <div className="pricing-row d-flex justify-content-between mb-3">
            <span className="text-muted">Subtotal</span>
            <span>{formatAmount(order.subtotal, order.currency)}</span>
          </div>

          {/* Shipping */}
          {order.shipping_amount > 0 && (
            <div className="pricing-row d-flex justify-content-between mb-3">
              <span className="text-muted">Shipping</span>
              <span>{formatAmount(order.shipping_amount, order.currency)}</span>
            </div>
          )}

          {/* Free Shipping */}
          {order.shipping_amount === 0 && order.has_physical_items && (
            <div className="pricing-row d-flex justify-content-between mb-3">
              <span className="text-muted">Shipping</span>
              <span className="text-success">Free</span>
            </div>
          )}

          {/* Tax */}
          {order.tax_amount > 0 && (
            <div className="pricing-row d-flex justify-content-between mb-3">
              <span className="text-muted">Tax</span>
              <span>{formatAmount(order.tax_amount, order.currency)}</span>
            </div>
          )}

          {/* Discount */}
          {hasDiscount && (
            <div className="pricing-row d-flex justify-content-between mb-3">
              <span className="text-muted">Discount</span>
              <span className="text-success">
                -{formatAmount(order.discount_amount, order.currency)}
              </span>
            </div>
          )}

          {/* Divider */}
          <hr className="my-3" />

          {/* Total */}
          <div className="pricing-row d-flex justify-content-between mb-0">
            <span className="fw-bold fs-5">Total</span>
            <span className="fw-bold fs-5">
              {formatAmount(order.total_amount, order.currency)}
            </span>
          </div>
        </div>

        {/* Payment Status Note */}
        <div className="mt-3 p-2 bg-light rounded">
          <div className="d-flex justify-content-between align-items-center">
            <span className="small text-muted">Payment Status:</span>
            <span className="small fw-semibold text-capitalize">
              {order.payment_status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

export default PricingSummary;
