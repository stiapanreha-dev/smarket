/**
 * Checkout Page Component
 *
 * Multi-step checkout process:
 * Step 1: Shipping Address (skipped for digital-only products)
 * Step 2: Delivery Method (skipped for digital-only products)
 * Step 3: Payment Method
 * Step 4: Order Review
 * Step 5: Confirmation
 *
 * Features:
 * - Multi-step flow with progress indicator
 * - Shipping address form with validation
 * - Delivery method selection with estimated dates
 * - Saved addresses selection
 * - Skip shipping/delivery for digital products
 * - Integration with checkoutStore
 * - Real-time cart snapshot
 */

import { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft } from 'react-icons/fa';
import {
  useCheckoutSession,
  useCheckoutStep,
  useCheckoutActions,
  useCheckoutLoading,
  useCheckoutError,
} from '@/store';
import {
  type ShippingAddressFormData,
  type Address,
  CheckoutStep,
  convertFormDataToAddress,
  convertAddressToFormData,
  requiresShipping,
} from '@/types';
import { Navbar, Footer } from '@/components/layout';
import { CheckoutStepper } from './components/CheckoutStepper';
import { ShippingAddressForm } from './components/ShippingAddressForm';
import { SavedAddresses } from './components/SavedAddresses';
import { DeliveryMethodStep } from './components/DeliveryMethodStep';
import './CheckoutPage.css';

/**
 * Checkout Page
 */
export function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  // Checkout state
  const session = useCheckoutSession();
  const currentStep = useCheckoutStep();
  const {
    createSession,
    updateShippingAddress,
    nextStep,
    previousStep,
  } = useCheckoutActions();
  const isLoading = useCheckoutLoading();
  const { error, clearError } = useCheckoutError();

  // Local state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savedAddresses] = useState<Address[]>([]); // TODO: Load from user profile
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Initialize checkout session on mount
  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        if (!session) {
          await createSession();
        }
      } catch (err) {
        console.error('Failed to initialize checkout:', err);
      }
    };

    initializeCheckout();
  }, [session, createSession]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Determine if we should show saved addresses or form
  useEffect(() => {
    if (savedAddresses.length === 0) {
      setShowAddressForm(true);
    }
  }, [savedAddresses]);

  // Handle back to cart
  const handleBackToCart = () => {
    navigate('/cart');
  };

  // Handle saved address selection
  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
  };

  // Handle add new address
  const handleAddNewAddress = () => {
    setShowAddressForm(true);
    setSelectedAddress(null);
  };

  // Handle shipping address submission
  const handleShippingSubmit = async (formData: ShippingAddressFormData) => {
    try {
      const addressDto = convertFormDataToAddress(formData);
      await updateShippingAddress(addressDto);
      nextStep();
    } catch (err) {
      console.error('Failed to update shipping address:', err);
    }
  };

  // Handle continue with saved address
  const handleContinueWithSavedAddress = async () => {
    if (!selectedAddress) {
      return;
    }

    try {
      await updateShippingAddress(selectedAddress);
      nextStep();
    } catch (err) {
      console.error('Failed to update shipping address:', err);
    }
  };

  // Loading state
  if (isLoading && !session) {
    return (
      <>
        <Navbar />
        <div className={`checkout-page ${isRTL ? 'rtl' : ''}`}>
          <Container className="py-4">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
              </div>
              <p className="mt-3 text-muted">
                {t('checkout.initializing', 'Initializing checkout...')}
              </p>
            </div>
          </Container>
        </div>
        <Footer />
      </>
    );
  }

  // No session error state
  if (!session) {
    return (
      <>
        <Navbar />
        <div className={`checkout-page ${isRTL ? 'rtl' : ''}`}>
          <Container className="py-4">
            <Alert variant="danger">
              {t('checkout.sessionError', 'Failed to create checkout session. Please try again.')}
            </Alert>
            <Button variant="primary" onClick={() => navigate('/cart')}>
              {t('checkout.backToCart', 'Back to Cart')}
            </Button>
          </Container>
        </div>
        <Footer />
      </>
    );
  }

  const needsShipping = requiresShipping(session);

  return (
    <>
      <Navbar />
      <div className={`checkout-page ${isRTL ? 'rtl' : ''}`}>
        <Container className="py-4">
          {/* Header */}
          <div className="checkout-header mb-4">
            <h1 className="mb-2">{t('checkout.title', 'Checkout')}</h1>
            <Button
              variant="link"
              className="text-decoration-none p-0"
              onClick={handleBackToCart}
            >
              {isRTL ? <FaArrowLeft className="ms-2" /> : <FaArrowLeft className="me-2" />}
              {t('checkout.backToCart', 'Back to Cart')}
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="danger" dismissible onClose={clearError} className="mb-4">
              {error}
            </Alert>
          )}

          {/* Stepper */}
          <CheckoutStepper
            currentStep={currentStep}
            requiresShipping={needsShipping}
          />

          {/* Main Content */}
          <Row className="g-4">
            {/* Left Column - Forms */}
            <Col lg={8}>
              {/* Step 1: Shipping Address */}
              {currentStep === CheckoutStep.SHIPPING_ADDRESS && needsShipping && (
                <div className="checkout-step">
                  <div className="step-header mb-4">
                    <h2>{t('checkout.shipping.title', 'Shipping Address')}</h2>
                    <p className="text-muted">
                      {t('checkout.shipping.subtitle', 'Where should we deliver your order?')}
                    </p>
                  </div>

                  {/* Saved Addresses */}
                  {!showAddressForm && savedAddresses.length > 0 && (
                    <>
                      <SavedAddresses
                        addresses={savedAddresses}
                        onSelectAddress={handleAddressSelect}
                        onAddNewAddress={handleAddNewAddress}
                      />

                      {selectedAddress && (
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <Button
                            variant="outline-secondary"
                            onClick={handleBackToCart}
                            disabled={isLoading}
                          >
                            {isRTL ? <FaArrowLeft className="ms-2" /> : <FaArrowLeft className="me-2" />}
                            {t('checkout.backToCart', 'Back to Cart')}
                          </Button>
                          <Button
                            variant="primary"
                            onClick={handleContinueWithSavedAddress}
                            disabled={isLoading}
                          >
                            {t('checkout.continueToDelivery', 'Continue to Delivery')}
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Address Form */}
                  {(showAddressForm || savedAddresses.length === 0) && (
                    <ShippingAddressForm
                      initialData={
                        session.shipping_address
                          ? convertAddressToFormData(session.shipping_address)
                          : undefined
                      }
                      onSubmit={handleShippingSubmit}
                      onBack={handleBackToCart}
                      isLoading={isLoading}
                    />
                  )}
                </div>
              )}

              {/* Step 2: Delivery Method */}
              {currentStep === CheckoutStep.DELIVERY_METHOD && needsShipping && (
                <div className="checkout-step">
                  <DeliveryMethodStep />
                </div>
              )}

              {/* Step 3: Payment Method (Placeholder) */}
              {currentStep === CheckoutStep.PAYMENT_METHOD && (
                <div className="checkout-step">
                  <Card>
                    <Card.Body className="text-center py-5">
                      <h3>{t('checkout.payment.title', 'Payment Method')}</h3>
                      <p className="text-muted">
                        {t('checkout.payment.comingSoon', 'Payment method selection coming soon...')}
                      </p>
                      <div className="d-flex justify-content-between mt-4">
                        <Button variant="outline-secondary" onClick={previousStep}>
                          {t('common.back', 'Back')}
                        </Button>
                        <Button variant="primary" onClick={nextStep}>
                          {t('common.continue', 'Continue')}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              )}

              {/* Step 4: Order Review (Placeholder) */}
              {currentStep === CheckoutStep.ORDER_REVIEW && (
                <div className="checkout-step">
                  <Card>
                    <Card.Body className="text-center py-5">
                      <h3>{t('checkout.review.title', 'Order Review')}</h3>
                      <p className="text-muted">
                        {t('checkout.review.comingSoon', 'Order review coming soon...')}
                      </p>
                      <div className="d-flex justify-content-between mt-4">
                        <Button variant="outline-secondary" onClick={previousStep}>
                          {t('common.back', 'Back')}
                        </Button>
                        <Button variant="success">
                          {t('checkout.placeOrder', 'Place Order')}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              )}

              {/* Step 5: Confirmation (Placeholder) */}
              {currentStep === CheckoutStep.CONFIRMATION && (
                <div className="checkout-step">
                  <Card>
                    <Card.Body className="text-center py-5">
                      <h3>{t('checkout.review.title', 'Review & Complete')}</h3>
                      <p className="text-muted">
                        {t('checkout.review.comingSoon', 'Order review coming soon...')}
                      </p>
                      <div className="d-flex justify-content-between mt-4">
                        <Button variant="outline-secondary" onClick={previousStep}>
                          {t('common.back', 'Back')}
                        </Button>
                        <Button variant="success">
                          {t('checkout.placeOrder', 'Place Order')}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              )}
            </Col>

            {/* Right Column - Order Summary */}
            <Col lg={4}>
              <Card className="order-summary sticky-top" style={{ top: '20px' }}>
                <Card.Header>
                  <h5 className="mb-0">{t('checkout.orderSummary', 'Order Summary')}</h5>
                </Card.Header>
                <Card.Body>
                  {/* Cart Items */}
                  <div className="summary-items mb-3">
                    {session.cart_snapshot.map((item, index) => (
                      <div key={index} className="summary-item d-flex justify-content-between mb-2">
                        <div className="flex-grow-1">
                          <div className="fw-medium">{item.productName}</div>
                          {item.variantName && (
                            <div className="text-muted small">{item.variantName}</div>
                          )}
                          <div className="text-muted small">
                            {t('common.quantity', 'Qty')}: {item.quantity}
                          </div>
                        </div>
                        <div className="fw-medium">
                          {session.totals.currency} {(item.price * item.quantity / 100).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="summary-totals">
                    <div className="d-flex justify-content-between mb-2">
                      <span>{t('checkout.subtotal', 'Subtotal')}:</span>
                      <span>{session.totals.currency} {(session.totals.subtotal / 100).toFixed(2)}</span>
                    </div>
                    {session.totals.shipping_amount > 0 && (
                      <div className="d-flex justify-content-between mb-2">
                        <span>{t('checkout.shipping', 'Shipping')}:</span>
                        <span>{session.totals.currency} {(session.totals.shipping_amount / 100).toFixed(2)}</span>
                      </div>
                    )}
                    {session.totals.tax_amount > 0 && (
                      <div className="d-flex justify-content-between mb-2">
                        <span>{t('checkout.tax', 'Tax')}:</span>
                        <span>{session.totals.currency} {(session.totals.tax_amount / 100).toFixed(2)}</span>
                      </div>
                    )}
                    {session.totals.discount_amount > 0 && (
                      <div className="d-flex justify-content-between mb-2 text-success">
                        <span>{t('checkout.discount', 'Discount')}:</span>
                        <span>-{session.totals.currency} {(session.totals.discount_amount / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <hr />
                    <div className="d-flex justify-content-between fw-bold fs-5">
                      <span>{t('checkout.total', 'Total')}:</span>
                      <span>{session.totals.currency} {(session.totals.total_amount / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
      <Footer />
    </>
  );
}

export default CheckoutPage;
