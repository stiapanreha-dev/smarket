/**
 * Order Review Step Component
 *
 * Step 4: Review & Confirm
 * Displays a comprehensive order summary before final confirmation:
 * - Shipping address with edit option
 * - Delivery method with edit option
 * - Payment method with edit option
 * - Order items from cart
 * - Pricing breakdown (subtotal, shipping, tax, total)
 * - Terms & Conditions acceptance
 * - Place Order button with loading state
 *
 * After successful order:
 * - Calls checkoutStore.completeCheckout()
 * - Clears cart
 * - Redirects to /orders/:orderId with success message
 */

import { useState } from 'react';
import { Card, Button, Alert, Form, Spinner, Row, Col, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaArrowLeft,
  FaEdit,
  FaMapMarkerAlt,
  FaTruck,
  FaCreditCard,
  FaShoppingCart,
  FaCheckCircle,
} from 'react-icons/fa';
import {
  useCheckoutSession,
  useCheckoutStore,
  useCheckoutLoading,
  useCheckoutError,
  useClearCart,
} from '@/store';
import { CheckoutStep, DeliveryMethodType, formatAddress } from '@/types';

interface OrderReviewStepProps {
  onBack?: () => void;
}

/**
 * Format price from cents to dollars
 */
function formatPrice(cents: number, currency: string = 'USD'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Get delivery method display name
 */
function getDeliveryMethodName(method: DeliveryMethodType): string {
  const names = {
    [DeliveryMethodType.STANDARD]: 'Standard Shipping',
    [DeliveryMethodType.EXPRESS]: 'Express Shipping',
    [DeliveryMethodType.PICKUP]: 'Pickup from Store',
  };
  return names[method] || method;
}

/**
 * Get last 4 digits of card from payment details
 */
function getCardLast4(paymentDetails: Record<string, any> | null): string {
  if (!paymentDetails?.card?.last4) {
    return '****';
  }
  return paymentDetails.card.last4;
}

export function OrderReviewStep({ onBack }: OrderReviewStepProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  // Checkout state
  const session = useCheckoutSession();
  const { completeCheckout, previousStep, goToStep } = useCheckoutStore();
  const isLoading = useCheckoutLoading();
  const { error: checkoutError, clearError } = useCheckoutError();

  // Cart actions
  const clearCart = useClearCart();

  // Local state
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session) {
    return (
      <Alert variant="warning">
        {t('checkout.review.noSession', 'No active checkout session. Please start over.')}
      </Alert>
    );
  }

  const { cart_snapshot, totals, shipping_address, delivery_method, payment_method, payment_details } = session;

  // Handle back button
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      previousStep();
    }
  };

  // Handle edit section navigation
  const handleEditShipping = () => {
    goToStep(CheckoutStep.SHIPPING_ADDRESS);
  };

  const handleEditDelivery = () => {
    goToStep(CheckoutStep.DELIVERY_METHOD);
  };

  const handleEditPayment = () => {
    goToStep(CheckoutStep.PAYMENT_METHOD);
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!acceptedTerms) {
      return;
    }

    try {
      setIsSubmitting(true);
      clearError();

      // Complete checkout
      const response = await completeCheckout();

      // Clear cart
      await clearCart();

      // Redirect to order page with success message
      navigate(`/orders/${response.order_id}`, {
        state: {
          success: true,
          message: t('checkout.review.orderPlaced', 'Order placed successfully!'),
          orderNumber: response.order_number,
        },
      });
    } catch (error) {
      console.error('Failed to place order:', error);
      setIsSubmitting(false);
      // Error is already set in checkoutStore
    }
  };

  const currency = totals.currency;
  const isPlaceOrderDisabled = !acceptedTerms || isLoading || isSubmitting;

  return (
    <div className="order-review-step">
      {/* Error Alert */}
      {checkoutError && (
        <Alert variant="danger" dismissible onClose={clearError} className="mb-4">
          {checkoutError}
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          {/* Shipping Address */}
          {shipping_address && (
            <Card className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  <FaMapMarkerAlt className="me-2" />
                  <strong>{t('checkout.review.shippingAddress', 'Shipping Address')}</strong>
                </div>
                <Button variant="link" size="sm" onClick={handleEditShipping}>
                  <FaEdit className="me-1" />
                  {t('common.edit', 'Edit')}
                </Button>
              </Card.Header>
              <Card.Body>
                <p className="mb-0">
                  {shipping_address.first_name} {shipping_address.last_name}
                  <br />
                  {shipping_address.street}
                  {shipping_address.street2 && (
                    <>
                      <br />
                      {shipping_address.street2}
                    </>
                  )}
                  <br />
                  {shipping_address.city}, {shipping_address.state} {shipping_address.postal_code}
                  <br />
                  {shipping_address.country}
                  <br />
                  {t('checkout.review.phone', 'Phone')}: {shipping_address.phone}
                </p>
              </Card.Body>
            </Card>
          )}

          {/* Delivery Method */}
          {delivery_method && (
            <Card className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  <FaTruck className="me-2" />
                  <strong>{t('checkout.review.deliveryMethod', 'Delivery Method')}</strong>
                </div>
                <Button variant="link" size="sm" onClick={handleEditDelivery}>
                  <FaEdit className="me-1" />
                  {t('common.edit', 'Edit')}
                </Button>
              </Card.Header>
              <Card.Body>
                <p className="mb-0">
                  {getDeliveryMethodName(delivery_method)}
                  <br />
                  <small className="text-muted">
                    {formatPrice(totals.shipping_amount, currency)}
                  </small>
                </p>
              </Card.Body>
            </Card>
          )}

          {/* Payment Method */}
          {payment_method && (
            <Card className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  <FaCreditCard className="me-2" />
                  <strong>{t('checkout.review.paymentMethod', 'Payment Method')}</strong>
                </div>
                <Button variant="link" size="sm" onClick={handleEditPayment}>
                  <FaEdit className="me-1" />
                  {t('common.edit', 'Edit')}
                </Button>
              </Card.Header>
              <Card.Body>
                <p className="mb-0">
                  {payment_method === 'card' ? (
                    <>
                      {t('checkout.review.card', 'Card ending in')} {getCardLast4(payment_details)}
                    </>
                  ) : (
                    payment_method
                  )}
                </p>
              </Card.Body>
            </Card>
          )}

          {/* Order Items */}
          <Card className="mb-4">
            <Card.Header>
              <FaShoppingCart className="me-2" />
              <strong>{t('checkout.review.orderItems', 'Order Items')}</strong>
            </Card.Header>
            <ListGroup variant="flush">
              {cart_snapshot.map((item, index) => (
                <ListGroup.Item key={index}>
                  <Row className="align-items-center">
                    <Col xs={7}>
                      <strong>{item.productName}</strong>
                      {item.variantName && (
                        <>
                          <br />
                          <small className="text-muted">{item.variantName}</small>
                        </>
                      )}
                      {item.sku && (
                        <>
                          <br />
                          <small className="text-muted">SKU: {item.sku}</small>
                        </>
                      )}
                    </Col>
                    <Col xs={2} className="text-center">
                      <span className="text-muted">x{item.quantity}</span>
                    </Col>
                    <Col xs={3} className="text-end">
                      <strong>{formatPrice(item.price * item.quantity, item.currency)}</strong>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Order Summary */}
          <Card className="mb-4" style={{ position: 'sticky', top: '20px' }}>
            <Card.Header>
              <strong>{t('checkout.review.orderSummary', 'Order Summary')}</strong>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>{t('checkout.review.subtotal', 'Subtotal')}</span>
                <span>{formatPrice(totals.subtotal, currency)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>{t('checkout.review.shipping', 'Shipping')}</span>
                <span>{formatPrice(totals.shipping_amount, currency)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>{t('checkout.review.tax', 'Tax')}</span>
                <span>{formatPrice(totals.tax_amount, currency)}</span>
              </div>
              {totals.discount_amount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>{t('checkout.review.discount', 'Discount')}</span>
                  <span>-{formatPrice(totals.discount_amount, currency)}</span>
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong>{t('checkout.review.total', 'Total')}</strong>
                <strong className="fs-5">{formatPrice(totals.total_amount, currency)}</strong>
              </div>

              {/* Terms & Conditions */}
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="accept-terms"
                  label={
                    <span>
                      {t('checkout.review.acceptTerms', 'I accept the')}{' '}
                      <a href="/terms" target="_blank" rel="noopener noreferrer">
                        {t('checkout.review.termsAndConditions', 'Terms & Conditions')}
                      </a>
                    </span>
                  }
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  required
                />
              </Form.Group>

              {/* Place Order Button */}
              <Button
                variant="primary"
                size="lg"
                className="w-100 mb-2"
                onClick={handlePlaceOrder}
                disabled={isPlaceOrderDisabled}
              >
                {isSubmitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    {t('checkout.review.processing', 'Processing...')}
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="me-2" />
                    {t('checkout.review.placeOrder', 'Place Order')}
                  </>
                )}
              </Button>

              {/* Back Button */}
              <Button variant="outline-secondary" className="w-100" onClick={handleBack} disabled={isSubmitting}>
                <FaArrowLeft className={isRTL ? 'ms-2' : 'me-2'} />
                {t('common.back', 'Back')}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
