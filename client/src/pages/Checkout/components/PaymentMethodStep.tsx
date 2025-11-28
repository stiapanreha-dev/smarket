/**
 * Payment Method Step Component
 *
 * Allows users to select and configure payment method:
 * - Credit/Debit Card (Stripe Elements)
 * - PayPal (coming soon)
 *
 * Features:
 * - Stripe card input with validation
 * - Cardholder name field
 * - Save card for future checkbox
 * - Security badges (SSL, PCI compliant)
 * - Back and Review Order buttons
 * - Integration with checkoutStore
 */

import { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaArrowRight, FaCreditCard, FaLock, FaShieldAlt } from 'react-icons/fa';
import {
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  useCheckoutSession,
  useCheckoutStore,
  useCheckoutLoading,
  useCheckoutErrorMessage,
  useClearCheckoutError,
  usePreviousStep,
  useNextStep,
} from '@/store';
import { PaymentMethodType } from '@/types';
import './PaymentMethodStep.css';

interface PaymentMethodStepProps {
  onBack?: () => void;
  onContinue?: () => void;
}

/**
 * Stripe card element options
 */
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#212529',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      '::placeholder': {
        color: '#6c757d',
      },
    },
    invalid: {
      color: '#dc3545',
      iconColor: '#dc3545',
    },
  },
  hidePostalCode: true, // We already collect this in shipping address
};

export function PaymentMethodStep({ onBack, onContinue }: PaymentMethodStepProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Stripe hooks
  const stripe = useStripe();
  const elements = useElements();

  // Checkout state
  const session = useCheckoutSession();
  const { updatePaymentMethod } = useCheckoutStore();
  const previousStep = usePreviousStep();
  const nextStep = useNextStep();
  const isLoading = useCheckoutLoading();
  const checkoutError = useCheckoutErrorMessage();
  const clearError = useClearCheckoutError();

  // Local state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>(
    session?.payment_method || PaymentMethodType.CARD,
  );
  const [cardholderName, setCardholderName] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle payment method selection
  const handlePaymentMethodSelect = (method: PaymentMethodType) => {
    setSelectedPaymentMethod(method);
    clearError();
    setCardError(null);
  };

  // Handle card element change
  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      previousStep();
    }
  };

  // Validate form
  const isFormValid = () => {
    if (selectedPaymentMethod === PaymentMethodType.CARD) {
      return cardholderName.trim() !== '' && cardComplete && !cardError;
    }
    // For future payment methods
    return false;
  };

  // Handle continue button
  const handleContinue = async () => {
    if (!stripe || !elements) {
      setCardError(t('checkout.paymentMethod.stripeNotLoaded', 'Payment system not ready. Please refresh the page.'));
      return;
    }

    if (!isFormValid()) {
      return;
    }

    try {
      setIsProcessing(true);
      setCardError(null);
      clearError();

      // Create payment method with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName,
          address: session?.shipping_address ? {
            line1: session.shipping_address.street,
            line2: session.shipping_address.street2 || undefined,
            city: session.shipping_address.city,
            state: session.shipping_address.state || undefined,
            postal_code: session.shipping_address.postal_code,
            country: session.shipping_address.country,
          } : undefined,
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      // Save payment method to backend (NOT the card data, just the method type and Stripe payment method ID)
      await updatePaymentMethod({
        payment_method: PaymentMethodType.CARD,
        payment_details: {
          stripe_payment_method_id: paymentMethod.id,
          card_brand: paymentMethod.card?.brand,
          card_last4: paymentMethod.card?.last4,
          save_card: saveCard,
        },
      });

      // Navigate to next step
      if (onContinue) {
        onContinue();
      } else {
        nextStep();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process payment method';
      setCardError(errorMessage);
      console.error('Payment method error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-method-step">
      {/* Header */}
      <div className="step-header mb-4">
        <h2>{t('checkout.paymentMethod.title', 'Payment Method')}</h2>
        <p className="text-muted">
          {t('checkout.paymentMethod.subtitle', 'Choose how you want to pay')}
        </p>
      </div>

      {/* Error Alert */}
      {(checkoutError || cardError) && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => {
            clearError();
            setCardError(null);
          }}
          className="mb-3"
        >
          {checkoutError || cardError}
        </Alert>
      )}

      {/* Payment Method Selection */}
      <Card className="payment-method-card mb-4">
        <Card.Body>
          <h5 className="mb-3">{t('checkout.paymentMethod.selectMethod', 'Select Payment Method')}</h5>

          {/* Credit/Debit Card */}
          <div
            className={`payment-option ${selectedPaymentMethod === PaymentMethodType.CARD ? 'selected' : ''}`}
            onClick={() => handlePaymentMethodSelect(PaymentMethodType.CARD)}
          >
            <Form.Check
              type="radio"
              id="payment-card"
              name="paymentMethod"
              checked={selectedPaymentMethod === PaymentMethodType.CARD}
              onChange={() => handlePaymentMethodSelect(PaymentMethodType.CARD)}
              label={
                <div className="payment-option-content">
                  <div className="payment-option-header">
                    <FaCreditCard className="payment-icon me-2" />
                    <span className="fw-medium">
                      {t('checkout.paymentMethod.creditDebitCard', 'Credit / Debit Card')}
                    </span>
                  </div>
                  <div className="payment-option-description text-muted small">
                    {t('checkout.paymentMethod.cardDescription', 'Pay securely with your card via Stripe')}
                  </div>
                </div>
              }
            />
          </div>

          {/* PayPal (Coming Soon) */}
          <div className="payment-option disabled">
            <Form.Check
              type="radio"
              id="payment-paypal"
              name="paymentMethod"
              disabled
              label={
                <div className="payment-option-content">
                  <div className="payment-option-header">
                    <FaCreditCard className="payment-icon me-2" />
                    <span className="fw-medium">
                      {t('checkout.paymentMethod.paypal', 'PayPal')}
                    </span>
                    <span className="badge bg-secondary ms-2">
                      {t('common.comingSoon', 'Coming Soon')}
                    </span>
                  </div>
                  <div className="payment-option-description text-muted small">
                    {t('checkout.paymentMethod.paypalDescription', 'Pay with your PayPal account')}
                  </div>
                </div>
              }
            />
          </div>
        </Card.Body>
      </Card>

      {/* Card Form (Stripe Elements) */}
      {selectedPaymentMethod === PaymentMethodType.CARD && (
        <Card className="card-form-card mb-4">
          <Card.Body>
            <h5 className="mb-3">{t('checkout.paymentMethod.cardDetails', 'Card Details')}</h5>

            {/* Cardholder Name */}
            <Form.Group className="mb-3">
              <Form.Label>
                {t('checkout.paymentMethod.cardholderName', 'Cardholder Name')}
                <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder={t('checkout.paymentMethod.cardholderNamePlaceholder', 'John Doe')}
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                required
                disabled={isProcessing}
              />
            </Form.Group>

            {/* Card Element */}
            <Form.Group className="mb-3">
              <Form.Label>
                {t('checkout.paymentMethod.cardInformation', 'Card Information')}
                <span className="text-danger">*</span>
              </Form.Label>
              <div className="card-element-wrapper">
                <CardElement
                  options={CARD_ELEMENT_OPTIONS}
                  onChange={handleCardChange}
                />
              </div>
              {cardError && (
                <Form.Text className="text-danger">
                  {cardError}
                </Form.Text>
              )}
            </Form.Group>

            {/* Save Card Checkbox */}
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="save-card"
                label={t('checkout.paymentMethod.saveCard', 'Save card for future purchases')}
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                disabled={isProcessing}
              />
            </Form.Group>

            {/* Security Badges */}
            <div className="security-badges mt-4 pt-3 border-top">
              <div className="d-flex align-items-center justify-content-center gap-3 text-muted small">
                <div className="d-flex align-items-center">
                  <FaLock className="me-1" />
                  <span>{t('checkout.paymentMethod.secureSSL', 'Secure SSL Encrypted')}</span>
                </div>
                <div className="d-flex align-items-center">
                  <FaShieldAlt className="me-1" />
                  <span>{t('checkout.paymentMethod.pciCompliant', 'PCI DSS Compliant')}</span>
                </div>
              </div>
              <p className="text-center text-muted small mt-2 mb-0">
                {t('checkout.paymentMethod.securityInfo', 'Your payment information is encrypted and secure. We never store your full card details.')}
              </p>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="payment-actions d-flex justify-content-between">
        <Button
          variant="outline-secondary"
          onClick={handleBack}
          disabled={isProcessing || isLoading}
        >
          {isRTL ? <FaArrowRight className="ms-2" /> : <FaArrowLeft className="me-2" />}
          {t('common.back', 'Back')}
        </Button>
        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={!isFormValid() || isProcessing || isLoading || !stripe}
        >
          {isProcessing ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              {t('common.processing', 'Processing...')}
            </>
          ) : (
            <>
              {t('checkout.reviewOrder', 'Review Order')}
              {isRTL ? <FaArrowLeft className="ms-2" /> : <FaArrowRight className="ms-2" />}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default PaymentMethodStep;
