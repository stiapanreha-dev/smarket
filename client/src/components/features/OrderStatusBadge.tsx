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
 * Note: Using string values directly to avoid duplicate keys from enums
 */
const STATUS_VARIANT_MAP: Record<string, 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'> = {
  // Common statuses (shared across types)
  pending: 'warning',
  payment_confirmed: 'info',
  cancelled: 'secondary',
  refund_requested: 'warning',
  refunded: 'secondary',

  // Main order statuses
  confirmed: 'info',
  processing: 'primary',
  completed: 'success',
  partially_refunded: 'secondary',

  // Physical item statuses
  preparing: 'primary',
  ready_to_ship: 'info',
  shipped: 'info',
  out_for_delivery: 'info',
  delivered: 'success',

  // Digital item statuses
  access_granted: 'success',
  downloaded: 'success',

  // Service item statuses
  booking_confirmed: 'info',
  reminder_sent: 'info',
  in_progress: 'primary',
  no_show: 'danger',
};

/**
 * Status icon mapping (optional)
 * Note: Using string values directly to avoid duplicate keys from enums
 */
const STATUS_ICON_MAP: Record<string, string> = {
  // Common statuses
  pending: '⏳',
  payment_confirmed: '💳',
  cancelled: '✕',
  refund_requested: '↩️',
  refunded: '↩️',

  // Main order statuses
  confirmed: '✓',
  processing: '⚙️',
  completed: '✅',
  partially_refunded: '↩️',

  // Physical item statuses
  preparing: '📦',
  ready_to_ship: '📋',
  shipped: '🚚',
  out_for_delivery: '🚚',
  delivered: '✅',

  // Digital item statuses
  access_granted: '🔓',
  downloaded: '⬇️',

  // Service item statuses
  booking_confirmed: '📅',
  reminder_sent: '🔔',
  in_progress: '⚙️',
  no_show: '❌',
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
