/**
 * Checkout Stepper Component
 *
 * Visual indicator of checkout progress with steps:
 * 1. Shipping Address
 * 2. Delivery Method
 * 3. Payment
 * 4. Review & Complete
 */

import { useTranslation } from 'react-i18next';
import { FaTruck, FaShippingFast, FaCreditCard, FaCheck } from 'react-icons/fa';
import { CheckoutStep } from '@/types';
import './CheckoutStepper.css';

interface StepInfo {
  key: CheckoutStep;
  number: number;
  label: string;
  icon: React.ReactNode;
  requiresShipping: boolean;
}

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  requiresShipping: boolean;
  onStepClick?: (step: CheckoutStep) => void;
}

export function CheckoutStepper({ currentStep, requiresShipping, onStepClick }: CheckoutStepperProps) {
  const { t } = useTranslation();

  // Define all steps
  const allSteps: StepInfo[] = [
    {
      key: CheckoutStep.SHIPPING_ADDRESS,
      number: 1,
      label: t('checkout.steps.shipping', 'Shipping'),
      icon: <FaTruck />,
      requiresShipping: true,
    },
    {
      key: CheckoutStep.DELIVERY_METHOD,
      number: 2,
      label: t('checkout.steps.delivery', 'Delivery'),
      icon: <FaShippingFast />,
      requiresShipping: true,
    },
    {
      key: CheckoutStep.PAYMENT_METHOD,
      number: requiresShipping ? 3 : 1,
      label: t('checkout.steps.payment', 'Payment'),
      icon: <FaCreditCard />,
      requiresShipping: false,
    },
    {
      key: CheckoutStep.ORDER_REVIEW,
      number: requiresShipping ? 4 : 2,
      label: t('checkout.steps.review', 'Review'),
      icon: <FaCheck />,
      requiresShipping: false,
    },
  ];

  // Filter steps based on whether shipping is required
  const steps = requiresShipping ? allSteps : allSteps.filter((step) => !step.requiresShipping || step.key === CheckoutStep.ORDER_REVIEW || step.key === CheckoutStep.CONFIRMATION);

  // Get current step index
  const currentStepIndex = steps.findIndex((step) => step.key === currentStep);

  // Determine if a step is completed
  const isStepCompleted = (stepIndex: number) => stepIndex < currentStepIndex;

  // Determine if a step is active
  const isStepActive = (stepIndex: number) => stepIndex === currentStepIndex;

  // Handle step click
  const handleStepClick = (step: StepInfo, stepIndex: number) => {
    // Only allow clicking on completed steps or current step
    if ((isStepCompleted(stepIndex) || isStepActive(stepIndex)) && onStepClick) {
      onStepClick(step.key);
    }
  };

  return (
    <div className="checkout-stepper">
      <div className="stepper-container">
        {steps.map((step, index) => {
          const isCompleted = isStepCompleted(index);
          const isActive = isStepActive(index);
          const isClickable = isCompleted || isActive;

          return (
            <div
              key={step.key}
              className={`stepper-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isClickable ? 'clickable' : ''}`}
              onClick={() => handleStepClick(step, index)}
            >
              {/* Step Number / Icon */}
              <div className="step-icon-wrapper">
                {index > 0 && <div className={`step-line step-line-left ${isCompleted ? 'completed' : ''}`} />}
                <div className="step-icon">
                  {isCompleted ? <FaCheck /> : step.icon}
                </div>
                {index < steps.length - 1 && <div className={`step-line step-line-right ${isCompleted ? 'completed' : ''}`} />}
              </div>

              {/* Step Label */}
              <div className="step-label">
                <span className="step-number">{step.number}</span>
                <span className="step-text">{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
