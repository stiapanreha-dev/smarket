import React from 'react';
import { Button as BSButton, ButtonProps as BSButtonProps, Spinner } from 'react-bootstrap';

export interface ButtonProps extends Omit<BSButtonProps, 'variant'> {
  /** Button variant - Bootstrap variants plus custom ones */
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark'
    | 'link'
    | 'outline-primary'
    | 'outline-secondary'
    | 'outline-success'
    | 'outline-danger'
    | 'outline-warning'
    | 'outline-info'
    | 'outline-light'
    | 'outline-dark';

  /** Size of the button */
  size?: 'sm' | 'lg';

  /** Loading state - shows spinner */
  loading?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Full width button */
  fullWidth?: boolean;

  /** Icon to display before text */
  leftIcon?: React.ReactNode;

  /** Icon to display after text */
  rightIcon?: React.ReactNode;

  /** Button content */
  children?: React.ReactNode;

  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Custom Button component - wrapper around react-bootstrap Button
 * with additional variants and features
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size,
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  onClick,
  ...rest
}) => {
  const isDisabled = disabled || loading;
  const fullWidthClass = fullWidth ? 'w-100' : '';

  return (
    <BSButton
      variant={variant}
      size={size}
      disabled={isDisabled}
      className={`${fullWidthClass} ${className}`.trim()}
      onClick={onClick}
      {...rest}
    >
      {loading && (
        <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
          className="me-2"
        />
      )}
      {!loading && leftIcon && <span className="me-2">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="ms-2">{rightIcon}</span>}
    </BSButton>
  );
};

export default Button;
