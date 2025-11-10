import React from 'react';
import { Spinner, SpinnerProps } from 'react-bootstrap';

export interface LoadingSpinnerProps extends Omit<SpinnerProps, 'animation' | 'variant'> {
  /** Spinner animation type */
  animation?: 'border' | 'grow';

  /** Spinner size */
  size?: 'sm';

  /** Spinner variant color */
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark';

  /** Center the spinner */
  centered?: boolean;

  /** Full page overlay spinner */
  fullPage?: boolean;

  /** Loading text to display */
  text?: string;

  /** Additional className */
  className?: string;
}

/**
 * LoadingSpinner component - displays a loading indicator
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  animation = 'border',
  size,
  variant = 'primary',
  centered = false,
  fullPage = false,
  text,
  className = '',
  ...rest
}) => {
  const spinner = (
    <Spinner
      animation={animation}
      role="status"
      size={size}
      variant={variant}
      className={className}
      {...rest}
    >
      <span className="visually-hidden">{text || 'Loading...'}</span>
    </Spinner>
  );

  if (fullPage) {
    return (
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9999,
        }}
      >
        {spinner}
        {text && <div className="mt-3 text-muted">{text}</div>}
      </div>
    );
  }

  if (centered) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-4">
        {spinner}
        {text && <div className="mt-3 text-muted">{text}</div>}
      </div>
    );
  }

  return (
    <>
      {spinner}
      {text && <span className="ms-2">{text}</span>}
    </>
  );
};

export default LoadingSpinner;
