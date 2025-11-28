/**
 * Common reusable UI components
 *
 * This directory contains generic, reusable UI components:
 * - Buttons
 * - Inputs
 * - Cards
 * - Modals
 * - Loaders
 * - Alerts
 * - Badges
 */

// Export all common components
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';

export { DatePicker } from './DatePicker';
export type { DatePickerProps } from './DatePicker';

export { Card } from './Card';
export type { CardProps } from './Card';

export { Modal } from './Modal';
export type { ModalProps } from './Modal';

export { LoadingSpinner } from './LoadingSpinner';
export type { LoadingSpinnerProps } from './LoadingSpinner';

export { Alert } from './Alert';
export type { AlertProps } from './Alert';

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { PageLoader } from './PageLoader';

export { SkeletonLoader, ProductCardSkeleton, OrderCardSkeleton } from './SkeletonLoader';

export { LazyImage } from './LazyImage';

// Error handling components
export { ErrorBoundary } from './ErrorBoundary';

export { FieldError, FormErrorSummary, InlineError, useFormErrors, scrollToError } from './FormError';
export type { InlineErrorProps } from './FormError';

export { OfflineBanner } from './OfflineBanner';
