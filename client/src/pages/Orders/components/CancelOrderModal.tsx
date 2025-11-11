import { useState } from 'react';
import { Form } from 'react-bootstrap';
import { Modal } from '@/components/common/Modal';

export interface CancelOrderModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: (reason?: string) => void;
  loading?: boolean;
  orderNumber: string;
}

/**
 * Predefined cancellation reasons
 */
const CANCELLATION_REASONS = [
  'Changed my mind',
  'Found a better price',
  'Ordered by mistake',
  'Delivery time too long',
  'Need to change shipping address',
  'Other',
];

/**
 * CancelOrderModal Component
 *
 * Confirmation modal for order cancellation:
 * - Warning message
 * - Optional cancellation reason
 * - Confirm/Cancel buttons
 */
export function CancelOrderModal({
  show,
  onHide,
  onConfirm,
  loading = false,
  orderNumber,
}: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const reason =
      selectedReason === 'Other' && customReason
        ? customReason
        : selectedReason || undefined;
    onConfirm(reason);
  };

  const handleHide = () => {
    // Reset form
    setSelectedReason('');
    setCustomReason('');
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={handleHide}
      title="Cancel Order"
      confirmText="Cancel Order"
      cancelText="Keep Order"
      confirmVariant="danger"
      onConfirm={handleConfirm}
      onCancel={handleHide}
      loading={loading}
      centered
    >
      <div className="cancel-order-modal">
        {/* Warning Message */}
        <div className="alert alert-warning mb-4">
          <strong>⚠️ Are you sure?</strong>
          <p className="mb-0 mt-2">
            You are about to cancel order <strong>#{orderNumber}</strong>. This action
            cannot be undone.
          </p>
        </div>

        {/* Cancellation Reason */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">
            Reason for cancellation (optional)
          </Form.Label>
          <Form.Select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            disabled={loading}
          >
            <option value="">Select a reason...</option>
            {CANCELLATION_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {/* Custom Reason Input (shown when "Other" is selected) */}
        {selectedReason === 'Other' && (
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Please specify</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Tell us why you're cancelling this order..."
              disabled={loading}
            />
          </Form.Group>
        )}

        {/* Additional Info */}
        <div className="text-muted small">
          <p className="mb-1">After cancellation:</p>
          <ul className="mb-0">
            <li>Your payment will be refunded within 5-7 business days</li>
            <li>You will receive a confirmation email</li>
            <li>Items will not be shipped</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}

export default CancelOrderModal;
