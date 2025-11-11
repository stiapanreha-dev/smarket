import React from 'react';
import { Badge as BSBadge } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import {
  OrderStatus,
  PhysicalItemStatus,
  DigitalItemStatus,
  ServiceItemStatus,
  type LineItemStatus,
} from '@/types';
import './OrderStatusBadge.css';

/**
 * All possible order and line item statuses
 */
export type AnyOrderStatus =
  | OrderStatus
  | PhysicalItemStatus
  | DigitalItemStatus
  | ServiceItemStatus
  | string;

export interface OrderStatusBadgeProps {
  /** Status value */
  status: AnyOrderStatus;

  /** Badge size */
  size?: 'sm' | 'md' | 'lg';

  /** Show as pill shape */
  pill?: boolean;

  /** Show status icon */
  showIcon?: boolean;

  /** Additional className */
  className?: string;
}

/**
 * Status color mapping based on requirements
 * Maps status to Bootstrap badge variants
 */
const STATUS_VARIANT_MAP: Record<string, 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'> = {
  // Main order statuses
  [OrderStatus.PENDING]: 'warning',
  [OrderStatus.CONFIRMED]: 'info',
  [OrderStatus.PROCESSING]: 'primary',
  [OrderStatus.COMPLETED]: 'success',
  [OrderStatus.CANCELLED]: 'secondary',
  [OrderStatus.REFUNDED]: 'secondary',
  [OrderStatus.PARTIALLY_REFUNDED]: 'secondary',

  // Physical item statuses
  [PhysicalItemStatus.PENDING]: 'warning',
  [PhysicalItemStatus.PAYMENT_CONFIRMED]: 'info',
  [PhysicalItemStatus.PREPARING]: 'primary',
  [PhysicalItemStatus.READY_TO_SHIP]: 'info',
  [PhysicalItemStatus.SHIPPED]: 'info',
  [PhysicalItemStatus.OUT_FOR_DELIVERY]: 'info',
  [PhysicalItemStatus.DELIVERED]: 'success',
  [PhysicalItemStatus.CANCELLED]: 'secondary',
  [PhysicalItemStatus.REFUND_REQUESTED]: 'warning',
  [PhysicalItemStatus.REFUNDED]: 'secondary',

  // Digital item statuses
  [DigitalItemStatus.PENDING]: 'warning',
  [DigitalItemStatus.PAYMENT_CONFIRMED]: 'info',
  [DigitalItemStatus.ACCESS_GRANTED]: 'success',
  [DigitalItemStatus.DOWNLOADED]: 'success',
  [DigitalItemStatus.CANCELLED]: 'secondary',
  [DigitalItemStatus.REFUND_REQUESTED]: 'warning',
  [DigitalItemStatus.REFUNDED]: 'secondary',

  // Service item statuses
  [ServiceItemStatus.PENDING]: 'warning',
  [ServiceItemStatus.PAYMENT_CONFIRMED]: 'info',
  [ServiceItemStatus.BOOKING_CONFIRMED]: 'info',
  [ServiceItemStatus.REMINDER_SENT]: 'info',
  [ServiceItemStatus.IN_PROGRESS]: 'primary',
  [ServiceItemStatus.COMPLETED]: 'success',
  [ServiceItemStatus.NO_SHOW]: 'danger',
  [ServiceItemStatus.CANCELLED]: 'secondary',
  [ServiceItemStatus.REFUND_REQUESTED]: 'warning',
  [ServiceItemStatus.REFUNDED]: 'secondary',
};

/**
 * Status icon mapping (optional)
 */
const STATUS_ICON_MAP: Record<string, string> = {
  // Main order statuses
  [OrderStatus.PENDING]: '⏳',
  [OrderStatus.CONFIRMED]: '✓',
  [OrderStatus.PROCESSING]: '⚙️',
  [OrderStatus.COMPLETED]: '✅',
  [OrderStatus.CANCELLED]: '✕',
  [OrderStatus.REFUNDED]: '↩️',
  [OrderStatus.PARTIALLY_REFUNDED]: '↩️',

  // Physical item statuses
  [PhysicalItemStatus.PENDING]: '⏳',
  [PhysicalItemStatus.PAYMENT_CONFIRMED]: '💳',
  [PhysicalItemStatus.PREPARING]: '📦',
  [PhysicalItemStatus.READY_TO_SHIP]: '📋',
  [PhysicalItemStatus.SHIPPED]: '🚚',
  [PhysicalItemStatus.OUT_FOR_DELIVERY]: '🚚',
  [PhysicalItemStatus.DELIVERED]: '✅',
  [PhysicalItemStatus.CANCELLED]: '✕',
  [PhysicalItemStatus.REFUND_REQUESTED]: '↩️',
  [PhysicalItemStatus.REFUNDED]: '↩️',

  // Digital item statuses
  [DigitalItemStatus.PENDING]: '⏳',
  [DigitalItemStatus.PAYMENT_CONFIRMED]: '💳',
  [DigitalItemStatus.ACCESS_GRANTED]: '🔓',
  [DigitalItemStatus.DOWNLOADED]: '⬇️',
  [DigitalItemStatus.CANCELLED]: '✕',
  [DigitalItemStatus.REFUND_REQUESTED]: '↩️',
  [DigitalItemStatus.REFUNDED]: '↩️',

  // Service item statuses
  [ServiceItemStatus.PENDING]: '⏳',
  [ServiceItemStatus.PAYMENT_CONFIRMED]: '💳',
  [ServiceItemStatus.BOOKING_CONFIRMED]: '📅',
  [ServiceItemStatus.REMINDER_SENT]: '🔔',
  [ServiceItemStatus.IN_PROGRESS]: '⚙️',
  [ServiceItemStatus.COMPLETED]: '✅',
  [ServiceItemStatus.NO_SHOW]: '❌',
  [ServiceItemStatus.CANCELLED]: '✕',
  [ServiceItemStatus.REFUND_REQUESTED]: '↩️',
  [ServiceItemStatus.REFUNDED]: '↩️',
};

/**
 * Get badge variant for status
 */
function getStatusVariant(status: string): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' {
  return STATUS_VARIANT_MAP[status] || 'secondary';
}

/**
 * Get icon for status
 */
function getStatusIcon(status: string): string | null {
  return STATUS_ICON_MAP[status] || null;
}

/**
 * Get human-readable text key for i18n
 */
function getStatusTextKey(status: string): string {
  // Convert status to translation key format: order.status.pending
  const statusKey = status.toLowerCase();
  return `order.status.${statusKey}`;
}

/**
 * Get fallback text if translation not found
 */
function getStatusFallbackText(status: string): string {
  // Convert snake_case to Title Case
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Size mapping for badge text and padding
 */
const SIZE_CLASSES = {
  sm: 'order-status-badge-sm',
  md: 'order-status-badge-md',
  lg: 'order-status-badge-lg',
};

/**
 * OrderStatusBadge Component
 *
 * Displays order or line item status with:
 * - Color-coded badge based on status
 * - Optional icons
 * - Internationalization support
 * - Size variants
 *
 * @example
 * ```tsx
 * <OrderStatusBadge status={OrderStatus.COMPLETED} size="md" showIcon />
 * <OrderStatusBadge status={PhysicalItemStatus.SHIPPED} pill />
 * ```
 */
export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  size = 'md',
  pill = true,
  showIcon = false,
  className = '',
}) => {
  const { t } = useTranslation();

  const variant = getStatusVariant(status);
  const icon = showIcon ? getStatusIcon(status) : null;
  const textKey = getStatusTextKey(status);
  const fallbackText = getStatusFallbackText(status);

  // Try to get translation, fall back to formatted status text
  const displayText = t(textKey, { defaultValue: fallbackText });

  return (
    <BSBadge
      bg={variant}
      pill={pill}
      className={`order-status-badge ${SIZE_CLASSES[size]} ${className}`.trim()}
    >
      {icon && <span className="me-1">{icon}</span>}
      {displayText}
    </BSBadge>
  );
};

export default OrderStatusBadge;
