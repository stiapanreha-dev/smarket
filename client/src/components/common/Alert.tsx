import React, { useState } from 'react';
import { Alert as BSAlert, type AlertProps as BSAlertProps } from 'react-bootstrap';

export interface AlertProps extends Omit<BSAlertProps, 'variant' | 'title'> {
  /** Alert variant */
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark';

  /** Alert title */
  title?: React.ReactNode;

  /** Alert content */
  children: React.ReactNode;

  /** Dismissible alert */
  dismissible?: boolean;

  /** Close handler */
  onClose?: () => void;

  /** Icon to display */
  icon?: React.ReactNode;

  /** Additional className */
  className?: string;
}

/**
 * Alert component - displays notifications and alerts
 */
export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onClose,
  icon,
  className = '',
  ...rest
}) => {
  const [show, setShow] = useState(true);

  const handleClose = () => {
    setShow(false);
    if (onClose) {
      onClose();
    }
  };

  if (!show) {
    return null;
  }

  return (
    <BSAlert
      variant={variant}
      dismissible={dismissible}
      onClose={handleClose}
      className={className}
      {...rest}
    >
      <div className="d-flex align-items-start">
        {icon && <div className="me-3">{icon}</div>}
        <div className="flex-grow-1">
          {title && <BSAlert.Heading>{title}</BSAlert.Heading>}
          <div>{children}</div>
        </div>
      </div>
    </BSAlert>
  );
};

export default Alert;
