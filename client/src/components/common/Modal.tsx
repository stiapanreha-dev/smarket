import React from 'react';
import { Modal as BSModal, ModalProps as BSModalProps } from 'react-bootstrap';
import { Button } from './Button';

export interface ModalProps extends Omit<BSModalProps, 'size'> {
  /** Show/hide modal */
  show: boolean;

  /** Close handler */
  onHide: () => void;

  /** Modal title */
  title?: React.ReactNode;

  /** Modal body content */
  children: React.ReactNode;

  /** Modal footer content */
  footer?: React.ReactNode;

  /** Modal size */
  size?: 'sm' | 'lg' | 'xl';

  /** Full screen modal */
  fullscreen?: true | 'sm-down' | 'md-down' | 'lg-down' | 'xl-down' | 'xxl-down';

  /** Centered modal */
  centered?: boolean;

  /** Scrollable modal */
  scrollable?: boolean;

  /** Show close button */
  showCloseButton?: boolean;

  /** Confirm button text */
  confirmText?: string;

  /** Cancel button text */
  cancelText?: string;

  /** Confirm button variant */
  confirmVariant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

  /** Confirm button handler */
  onConfirm?: () => void;

  /** Cancel button handler */
  onCancel?: () => void;

  /** Loading state for confirm button */
  loading?: boolean;

  /** Disable confirm button */
  disableConfirm?: boolean;

  /** Additional className */
  className?: string;
}

/**
 * Modal component - wrapper around react-bootstrap Modal
 * with additional customization options
 */
export const Modal: React.FC<ModalProps> = ({
  show,
  onHide,
  title,
  children,
  footer,
  size,
  fullscreen,
  centered = false,
  scrollable = false,
  showCloseButton = true,
  confirmText,
  cancelText,
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  loading = false,
  disableConfirm = false,
  className = '',
  ...rest
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onHide();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const defaultFooter = (confirmText || cancelText) && (
    <>
      {cancelText && (
        <Button variant="secondary" onClick={handleCancel} disabled={loading}>
          {cancelText}
        </Button>
      )}
      {confirmText && (
        <Button
          variant={confirmVariant}
          onClick={handleConfirm}
          loading={loading}
          disabled={disableConfirm}
        >
          {confirmText}
        </Button>
      )}
    </>
  );

  return (
    <BSModal
      show={show}
      onHide={onHide}
      size={size}
      fullscreen={fullscreen}
      centered={centered}
      scrollable={scrollable}
      className={className}
      {...rest}
    >
      {title && (
        <BSModal.Header closeButton={showCloseButton}>
          <BSModal.Title>{title}</BSModal.Title>
        </BSModal.Header>
      )}
      <BSModal.Body>{children}</BSModal.Body>
      {(footer || defaultFooter) && (
        <BSModal.Footer>
          {footer || defaultFooter}
        </BSModal.Footer>
      )}
    </BSModal>
  );
};

export default Modal;
