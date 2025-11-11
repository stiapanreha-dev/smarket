import { Card, Row, Col } from 'react-bootstrap';
import { type Order } from '@/types';

export interface ShippingPaymentInfoProps {
  order: Order;
}

/**
 * Format address for display with line breaks
 */
function formatAddressMultiline(address: Order['shipping_address']): JSX.Element | string {
  if (!address) return 'N/A';

  return (
    <>
      {address.first_name && address.last_name && (
        <div className="fw-semibold">
          {address.first_name} {address.last_name}
        </div>
      )}
      {address.company && <div>{address.company}</div>}
      <div>{address.street}</div>
      {address.street2 && <div>{address.street2}</div>}
      <div>
        {address.city}
        {address.state && `, ${address.state}`} {address.postal_code}
      </div>
      <div>{address.country}</div>
      {address.phone && <div className="mt-1">Phone: {address.phone}</div>}
    </>
  );
}

/**
 * Get delivery method display text
 */
function getDeliveryMethodText(order: Order): string {
  // Try to get from metadata or order properties
  if (order.delivery_method) {
    return order.delivery_method;
  }

  // Check if there are physical items
  const hasPhysicalItems = order.line_items.some(item => item.type === 'physical');
  if (!hasPhysicalItems) {
    return 'Digital Delivery';
  }

  // Default
  return 'Standard Shipping';
}

/**
 * Format payment method for display
 */
function formatPaymentMethod(paymentMethod: string | null): string {
  if (!paymentMethod) return 'N/A';

  // If it's a card ending, extract last 4 digits
  const cardMatch = paymentMethod.match(/\*+(\d{4})/);
  if (cardMatch) {
    return `Card ending in ${cardMatch[1]}`;
  }

  // Format common payment methods
  const methodMap: Record<string, string> = {
    card: 'Credit/Debit Card',
    stripe: 'Stripe',
    paypal: 'PayPal',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
  };

  return methodMap[paymentMethod.toLowerCase()] || paymentMethod;
}

/**
 * ShippingPaymentInfo Component
 *
 * Displays shipping and payment information:
 * - Shipping address (if applicable)
 * - Billing address
 * - Delivery method
 * - Payment method
 */
export function ShippingPaymentInfo({ order }: ShippingPaymentInfoProps) {
  const hasShippingAddress = !!order.shipping_address;
  const hasBillingAddress = !!order.billing_address;

  return (
    <Card className="shipping-payment-info">
      <Card.Body>
        <h5 className="mb-4">Shipping & Payment Information</h5>

        <Row>
          {/* Shipping Address */}
          {hasShippingAddress && (
            <Col xs={12} md={6} className="mb-4">
              <div className="info-section">
                <h6 className="text-muted mb-3">Shipping Address</h6>
                <div className="info-content">
                  {formatAddressMultiline(order.shipping_address)}
                </div>
              </div>
            </Col>
          )}

          {/* Billing Address */}
          {hasBillingAddress && (
            <Col xs={12} md={6} className="mb-4">
              <div className="info-section">
                <h6 className="text-muted mb-3">Billing Address</h6>
                <div className="info-content">
                  {formatAddressMultiline(order.billing_address)}
                </div>
              </div>
            </Col>
          )}

          {/* Delivery Method */}
          <Col xs={12} md={6} className="mb-4 mb-md-0">
            <div className="info-section">
              <h6 className="text-muted mb-3">Delivery Method</h6>
              <div className="info-content">
                {getDeliveryMethodText(order)}
              </div>
            </div>
          </Col>

          {/* Payment Method */}
          <Col xs={12} md={6}>
            <div className="info-section">
              <h6 className="text-muted mb-3">Payment Method</h6>
              <div className="info-content">
                {formatPaymentMethod(order.payment_method)}
              </div>
              {order.payment_intent_id && (
                <div className="text-muted small mt-2">
                  Payment ID: {order.payment_intent_id.slice(0, 20)}...
                </div>
              )}
            </div>
          </Col>
        </Row>

        {/* Guest Email/Phone (if applicable) */}
        {(order.guest_email || order.guest_phone) && (
          <Row className="mt-4">
            <Col>
              <div className="info-section border-top pt-3">
                <h6 className="text-muted mb-3">Contact Information</h6>
                <div className="info-content">
                  {order.guest_email && <div>Email: {order.guest_email}</div>}
                  {order.guest_phone && <div>Phone: {order.guest_phone}</div>}
                </div>
              </div>
            </Col>
          </Row>
        )}

        {/* Order Notes (if any) */}
        {order.notes && (
          <Row className="mt-4">
            <Col>
              <div className="info-section border-top pt-3">
                <h6 className="text-muted mb-3">Order Notes</h6>
                <div className="info-content">
                  <em>{order.notes}</em>
                </div>
              </div>
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
}

export default ShippingPaymentInfo;
