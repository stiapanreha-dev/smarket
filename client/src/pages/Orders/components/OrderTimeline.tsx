import { Card } from 'react-bootstrap';
import { format } from 'date-fns';
import {
  type Order,
  type OrderLineItem,
  type PhysicalFulfillmentData,
  LineItemType,
} from '@/types';

export interface OrderTimelineProps {
  order: Order;
}

/**
 * Get timeline steps based on line items types
 */
function getTimelineSteps(order: Order): string[] {
  const hasPhysical = order.line_items.some(item => item.type === LineItemType.PHYSICAL);
  const hasDigital = order.line_items.some(item => item.type === LineItemType.DIGITAL);
  const hasService = order.line_items.some(item => item.type === LineItemType.SERVICE);

  // For mixed carts, show a generic timeline
  if ((hasPhysical ? 1 : 0) + (hasDigital ? 1 : 0) + (hasService ? 1 : 0) > 1) {
    return ['pending', 'payment_confirmed', 'processing', 'completed'];
  }

  // Physical items timeline
  if (hasPhysical) {
    return [
      'pending',
      'payment_confirmed',
      'preparing',
      'ready_to_ship',
      'shipped',
      'delivered',
    ];
  }

  // Digital items timeline
  if (hasDigital) {
    return ['pending', 'payment_confirmed', 'access_granted', 'downloaded'];
  }

  // Service items timeline
  if (hasService) {
    return [
      'pending',
      'payment_confirmed',
      'booking_confirmed',
      'reminder_sent',
      'in_progress',
      'completed',
    ];
  }

  // Default timeline
  return ['pending', 'payment_confirmed', 'processing', 'completed'];
}

/**
 * Get status display text
 */
function getStatusDisplayText(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get the furthest status from all line items
 */
function getCurrentStatus(order: Order): string {
  if (order.line_items.length === 0) {
    return 'pending';
  }

  // Get all unique statuses
  const statuses = order.line_items.map(item => item.status);

  // For cancelled/refunded, show that
  if (statuses.some(s => s === 'cancelled')) return 'cancelled';
  if (statuses.some(s => s === 'refunded')) return 'refunded';

  // Otherwise, return the most common status or the first one
  return statuses[0];
}

/**
 * Get timestamp for a specific status from status history
 */
function getStatusTimestamp(lineItem: OrderLineItem, status: string): string | null {
  const historyEntry = lineItem.status_history?.find(entry => entry.to === status);
  return historyEntry?.timestamp || null;
}

/**
 * Get tracking info from line items
 */
function getTrackingInfo(order: Order): { carrier?: string; trackingNumber?: string } | null {
  const physicalItem = order.line_items.find(item => item.type === LineItemType.PHYSICAL);
  if (!physicalItem?.fulfillment_data) return null;

  const data = physicalItem.fulfillment_data as PhysicalFulfillmentData;
  if (data.carrier || data.tracking_number) {
    return {
      carrier: data.carrier,
      trackingNumber: data.tracking_number,
    };
  }

  return null;
}

/**
 * OrderTimeline Component
 *
 * Displays FSM-based order timeline with:
 * - Vertical stepper showing order progression
 * - Status-specific steps (physical/digital/service)
 * - Timestamps for each completed step
 * - Tracking information for shipped items
 */
export function OrderTimeline({ order }: OrderTimelineProps) {
  const steps = getTimelineSteps(order);
  const currentStatus = getCurrentStatus(order);
  const currentStepIndex = steps.indexOf(currentStatus);
  const trackingInfo = getTrackingInfo(order);

  // Get first line item for status history (assuming all items progress similarly)
  const firstLineItem = order.line_items[0];

  return (
    <Card className="order-timeline">
      <Card.Body>
        <h5 className="mb-4">Order Timeline</h5>

        {/* Tracking Info (if shipped) */}
        {trackingInfo && (
          <div className="alert alert-info mb-4">
            <strong>Tracking Information</strong>
            <br />
            {trackingInfo.carrier && <span>Carrier: {trackingInfo.carrier}<br /></span>}
            {trackingInfo.trackingNumber && (
              <span>Tracking Number: {trackingInfo.trackingNumber}</span>
            )}
          </div>
        )}

        {/* Timeline Steps */}
        <div className="timeline">
          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const timestamp = firstLineItem
              ? getStatusTimestamp(firstLineItem, step)
              : null;

            return (
              <div
                key={step}
                className={`timeline-item ${isCompleted ? 'completed' : ''} ${
                  isCurrent ? 'current' : ''
                }`}
              >
                <div className="timeline-marker">
                  {isCompleted ? (
                    <div className="timeline-marker-inner completed">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="timeline-marker-inner pending"></div>
                  )}
                </div>
                <div className="timeline-content">
                  <div className="timeline-title">{getStatusDisplayText(step)}</div>
                  {timestamp && (
                    <div className="timeline-date">
                      {format(new Date(timestamp), 'MMM dd, yyyy - hh:mm a')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cancelled Status */}
        {(currentStatus === 'cancelled' || currentStatus === 'refunded') && (
          <div className="alert alert-danger mt-3">
            <strong>Order {getStatusDisplayText(currentStatus)}</strong>
            {firstLineItem?.last_status_change && (
              <div className="small mt-1">
                {format(
                  new Date(firstLineItem.last_status_change),
                  'MMM dd, yyyy - hh:mm a',
                )}
              </div>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default OrderTimeline;
