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

import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Alert, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft } from 'react-icons/fa';
import { Elements } from '@stripe/react-stripe-js';
import {
  useCheckoutSession,
  useCheckoutStep,
  useCreateSession,
  useUpdateShippingAddress,
  useNextStep,
  usePreviousStep,
  useCheckoutLoading,
  useCheckoutErrorMessage,
  useClearCheckoutError,
} from '@/store';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/api/axios.config';
import type { UserAddress } from '@/types/address';
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
import { PaymentMethodStep } from './components/PaymentMethodStep';
import { OrderReviewStep } from './components/OrderReviewStep';
import { getStripe } from '@/config/stripe.config';
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
  const createSession = useCreateSession();
  const updateShippingAddress = useUpdateShippingAddress();
  const nextStep = useNextStep();
  const previousStep = usePreviousStep();
  const isLoading = useCheckoutLoading();
  const error = useCheckoutErrorMessage();
  const clearError = useClearCheckoutError();

  // Auth state
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // Local state - start with addressesLoading=true if authenticated to wait for addresses
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [defaultAddressForForm, setDefaultAddressForForm] = useState<Address | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(isAuthenticated);
  const [addressesLoadAttempted, setAddressesLoadAttempted] = useState(false);

  // Convert UserAddress to Address format for SavedAddresses component
  const convertUserAddressToAddress = useCallback((userAddr: UserAddress): Address => ({
    first_name: userAddr.full_name.split(' ')[0] || '',
    last_name: userAddr.full_name.split(' ').slice(1).join(' ') || '',
    street: userAddr.address_line1,
    street2: userAddr.address_line2 || undefined,
    city: userAddr.city,
    state: userAddr.state || undefined,
    postal_code: userAddr.postal_code,
    country: userAddr.country,
    phone: userAddr.phone,
  }), []);

  // Convert Address to ShippingAddressFormData for form pre-fill
  const convertAddressToShippingFormData = useCallback((addr: Address): Partial<ShippingAddressFormData> => ({
    fullName: `${addr.first_name || ''} ${addr.last_name || ''}`.trim(),
    phone: addr.phone || '',
    addressLine1: addr.street || '',
    addressLine2: addr.street2 || '',
    city: addr.city || '',
    state: addr.state || '',
    postalCode: addr.postal_code || '',
    country: addr.country || 'US',
  }), []);

  // Load saved addresses from user profile
  useEffect(() => {
    const loadSavedAddresses = async () => {
      if (!isAuthenticated) {
        setSavedAddresses([]);
        setAddressesLoading(false);
        setAddressesLoadAttempted(true);
        return;
      }

      try {
        setAddressesLoading(true);
        const response = await apiClient.get<UserAddress[]>('/users/me/addresses');
        const addresses = response.data.map(convertUserAddressToAddress);
        setSavedAddresses(addresses);

        // Auto-select default address if available
        const defaultAddr = response.data.find(addr => addr.is_default);
        if (defaultAddr) {
          const converted = convertUserAddressToAddress(defaultAddr);
          setSelectedAddress(converted);
          setDefaultAddressForForm(converted);
        } else if (response.data.length > 0) {
          // Use first address as default for form pre-fill and selection
          const firstAddress = convertUserAddressToAddress(response.data[0]);
          setSelectedAddress(firstAddress);
          setDefaultAddressForForm(firstAddress);
        }
      } catch (err) {
        console.error('Failed to load saved addresses:', err);
        setSavedAddresses([]);
      } finally {
        setAddressesLoading(false);
        setAddressesLoadAttempted(true);
      }
    };

    loadSavedAddresses();
  }, [isAuthenticated, convertUserAddressToAddress]);

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
  // Only switch to "new address" mode if addresses were loaded and there are none
  useEffect(() => {
    if (addressesLoadAttempted && savedAddresses.length === 0) {
      setShowAddressForm(true);
    }
  }, [savedAddresses, addressesLoadAttempted]);

  // Handle back to cart
  const handleBackToCart = () => {
    navigate('/cart');
  };

  // Handle saved address selection
  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setShowAddressForm(false); // Switch to existing address mode
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

      // Save new address to profile if checkbox is checked and user is authenticated
      if (formData.saveAddress && isAuthenticated && showAddressForm) {
        try {
          const createAddressDto = {
            full_name: formData.fullName,
            phone: formData.phone,
            address_line1: formData.addressLine1,
            address_line2: formData.addressLine2 || undefined,
            city: formData.city,
            state: formData.state || undefined,
            postal_code: formData.postalCode,
            country: formData.country,
            is_default: savedAddresses.length === 0, // Make default if first address
          };
          await apiClient.post('/users/me/addresses', createAddressDto);
        } catch (saveErr) {
          console.error('Failed to save address to profile:', saveErr);
          // Don't block checkout if address save fails
        }
      }

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
                    <h2>{t('checkout.shippingAddress.title', 'Shipping Address')}</h2>
                    <p className="text-muted">
                      {t('checkout.shippingAddress.subtitle', 'Where should we deliver your order?')}
                    </p>
                  </div>

                  {/* Address Selection - show if user has saved addresses */}
                  {savedAddresses.length > 0 && !addressesLoading && (
                    <Card className="mb-4">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0">{t('checkout.shippingAddress.selectAddress', 'Select Address')}</h6>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={handleAddNewAddress}
                          >
                            {t('checkout.shippingAddress.newAddress', '+ New Address')}
                          </Button>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          {savedAddresses.map((addr, index) => (
                            <Button
                              key={index}
                              variant={selectedAddress === addr ? 'primary' : 'outline-secondary'}
                              size="sm"
                              onClick={() => handleAddressSelect(addr)}
                              className="text-start"
                            >
                              <div className="fw-medium">{addr.first_name} {addr.last_name}</div>
                              <small className="text-muted d-block">{addr.street}, {addr.city}</small>
                            </Button>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  )}

                  {/* Show loading while addresses are being fetched */}
                  {addressesLoading && (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
                      </div>
                    </div>
                  )}

                  {/* Address Form - always show, pre-filled with selected address */}
                  {!addressesLoading && addressesLoadAttempted && (() => {
                    // Calculate form data and key outside JSX for clarity
                    const formData = session.shipping_address
                      ? convertAddressToFormData(session.shipping_address)
                      : showAddressForm
                        ? user
                          ? {
                              fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                              phone: user.phone || '',
                              country: user.locale === 'ru' ? 'RU' : user.locale === 'ar' ? 'AE' : 'US',
                            }
                          : undefined
                        : selectedAddress
                          ? convertAddressToShippingFormData(selectedAddress)
                          : defaultAddressForForm
                            ? convertAddressToShippingFormData(defaultAddressForForm)
                            : user
                              ? {
                                  fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                                  phone: user.phone || '',
                                  country: user.locale === 'ru' ? 'RU' : user.locale === 'ar' ? 'AE' : 'US',
                                }
                              : undefined;

                    // Generate unique key based on actual form data to ensure re-render
                    const formKey = showAddressForm
                      ? 'new-address'
                      : formData
                        ? `addr-${formData.addressLine1 || ''}-${formData.city || ''}-${formData.postalCode || ''}`
                        : 'empty';

                    return (
                      <ShippingAddressForm
                        key={formKey}
                        initialData={formData}
                        onSubmit={handleShippingSubmit}
                        onBack={handleBackToCart}
                        isLoading={isLoading}
                        isNewAddress={showAddressForm}
                      />
                    );
                  })()}
                </div>
              )}

              {/* Step 2: Delivery Method */}
              {currentStep === CheckoutStep.DELIVERY_METHOD && needsShipping && (
                <div className="checkout-step">
                  <DeliveryMethodStep />
                </div>
              )}

              {/* Step 3: Payment Method */}
              {currentStep === CheckoutStep.PAYMENT_METHOD && (
                <div className="checkout-step">
                  <Elements stripe={getStripe()}>
                    <PaymentMethodStep />
                  </Elements>
                </div>
              )}

              {/* Step 4: Order Review */}
              {currentStep === CheckoutStep.ORDER_REVIEW && (
                <div className="checkout-step">
                  <OrderReviewStep />
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
