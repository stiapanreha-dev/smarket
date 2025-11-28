/**
 * Delivery Method Step Component
 *
 * Allows users to select delivery method for physical items:
 * - Standard Shipping (5-7 days) - $5.99
 * - Express Shipping (2-3 days) - $12.99
 * - Pickup from store - Free
 *
 * Features:
 * - Radio button selection
 * - Estimated delivery date for each option
 * - Description for each method
 * - Back and Continue buttons
 * - Integration with checkoutStore
 */

import { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaArrowRight, FaTruck, FaShippingFast, FaStore } from 'react-icons/fa';
import {
  useCheckoutSession,
  useCheckoutStore,
  useCheckoutLoading,
  useCheckoutErrorMessage,
  useClearCheckoutError,
  usePreviousStep,
  useNextStep,
} from '@/store';
import type { DeliveryOption, DeliveryMethodType } from '@/types';
import './DeliveryMethodStep.css';

interface DeliveryMethodStepProps {
  onBack?: () => void;
  onContinue?: () => void;
}

/**
 * Get icon for delivery method type
 */
function getDeliveryIcon(type: DeliveryMethodType) {
  switch (type) {
    case 'standard':
      return <FaTruck />;
    case 'express':
      return <FaShippingFast />;
    case 'pickup':
      return <FaStore />;
    default:
      return <FaTruck />;
  }
}

/**
 * Calculate estimated delivery date
 */
function getEstimatedDeliveryDate(estimatedDays: { min: number; max: number }): string {
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + estimatedDays.min);
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + estimatedDays.max);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
}

export function DeliveryMethodStep({ onBack, onContinue }: DeliveryMethodStepProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Checkout state
  const session = useCheckoutSession();
  const { loadDeliveryOptions, updateDeliveryMethod } = useCheckoutStore();
  const previousStep = usePreviousStep();
  const nextStep = useNextStep();
  const isLoading = useCheckoutLoading();
  const error = useCheckoutErrorMessage();
  const clearError = useClearCheckoutError();

  // Local state
  const deliveryOptions = useCheckoutStore((state) => state.deliveryOptions);
  const [selectedMethod, setSelectedMethod] = useState<DeliveryMethodType | null>(
    session?.delivery_method || null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load delivery options on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        if (!deliveryOptions) {
          await loadDeliveryOptions();
        }
      } catch (err) {
        console.error('Failed to load delivery options:', err);
      }
    };

    loadOptions();
  }, [deliveryOptions, loadDeliveryOptions]);

  // Handle method selection
  const handleMethodSelect = (type: DeliveryMethodType) => {
    setSelectedMethod(type);
    clearError();
  };

  // Handle back button
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      previousStep();
    }
  };

  // Handle continue button
  const handleContinue = async () => {
    if (!selectedMethod) {
      return;
    }

    try {
      setIsSubmitting(true);
      await updateDeliveryMethod({ delivery_method: selectedMethod });

      // Navigate to next step
      if (onContinue) {
        onContinue();
      } else {
        nextStep();
      }
    } catch (err) {
      console.error('Failed to update delivery method:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading && !deliveryOptions) {
    return (
      <Card>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">
            {t('checkout.deliveryMethod.loading', 'Loading delivery options...')}
          </p>
        </Card.Body>
      </Card>
    );
  }

  // Error state
  if (error && !deliveryOptions) {
    return (
      <Card>
        <Card.Body>
          <Alert variant="danger">{error}</Alert>
          <div className="d-flex justify-content-between">
            <Button variant="outline-secondary" onClick={handleBack}>
              {isRTL ? <FaArrowRight className="ms-2" /> : <FaArrowLeft className="me-2" />}
              {t('common.back', 'Back')}
            </Button>
            <Button variant="primary" onClick={loadDeliveryOptions}>
              {t('common.retry', 'Retry')}
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="delivery-method-step">
      {/* Header */}
      <div className="step-header mb-4">
        <h2>{t('checkout.deliveryMethod.title', 'Delivery Method')}</h2>
        <p className="text-muted">
          {t('checkout.deliveryMethod.subtitle', 'Choose how you want to receive your order')}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={clearError} className="mb-3">
          {error}
        </Alert>
      )}

      {/* Delivery Options */}
      <Card className="delivery-options-card">
        <Card.Body>
          <Form>
            {deliveryOptions?.map((option) => (
              <div
                key={option.type}
                className={`delivery-option ${selectedMethod === option.type ? 'selected' : ''}`}
                onClick={() => handleMethodSelect(option.type)}
              >
                <Form.Check
                  type="radio"
                  id={`delivery-${option.type}`}
                  name="deliveryMethod"
                  checked={selectedMethod === option.type}
                  onChange={() => handleMethodSelect(option.type)}
                  label={
                    <div className="delivery-option-content">
                      <div className="delivery-option-header">
                        <div className="delivery-icon">{getDeliveryIcon(option.type)}</div>
                        <div className="delivery-info">
                          <div className="delivery-name">{option.name}</div>
                          <div className="delivery-description">{option.description}</div>
                          <div className="delivery-estimated">
                            {t('checkout.deliveryMethod.estimated', 'Estimated delivery')}:{' '}
                            {getEstimatedDeliveryDate(option.estimatedDays)}
                          </div>
                        </div>
                        <div className="delivery-price">
                          {option.price === 0
                            ? t('common.free', 'Free')
                            : `${option.currency} ${(option.price / 100).toFixed(2)}`}
                        </div>
                      </div>
                    </div>
                  }
                />
              </div>
            ))}
          </Form>
        </Card.Body>
      </Card>

      {/* Action Buttons */}
      <div className="delivery-actions mt-4 d-flex justify-content-between">
        <Button
          variant="outline-secondary"
          onClick={handleBack}
          disabled={isSubmitting}
        >
          {isRTL ? <FaArrowRight className="ms-2" /> : <FaArrowLeft className="me-2" />}
          {t('common.back', 'Back')}
        </Button>
        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={!selectedMethod || isSubmitting}
        >
          {isSubmitting
            ? t('common.loading', 'Loading...')
            : t('checkout.continueToPayment', 'Continue to Payment')}
          {!isSubmitting && (isRTL ? <FaArrowLeft className="ms-2" /> : <FaArrowRight className="ms-2" />)}
        </Button>
      </div>
    </div>
  );
}

export default DeliveryMethodStep;
