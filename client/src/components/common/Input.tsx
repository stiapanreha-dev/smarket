import React, { forwardRef } from 'react';
import { Form, InputGroup } from 'react-bootstrap';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label */
  label?: string;

  /** Error message to display */
  error?: string;

  /** Helper text to display below input */
  helperText?: string;

  /** Input size */
  size?: 'sm' | 'lg';

  /** Icon to display at the start */
  startIcon?: React.ReactNode;

  /** Icon to display at the end */
  endIcon?: React.ReactNode;

  /** Is the field required */
  required?: boolean;

  /** Full width input */
  fullWidth?: boolean;

  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local';

  /** Additional className for the container */
  containerClassName?: string;
}

/**
 * Custom Input component with label, error message, and icon support
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size,
      startIcon,
      endIcon,
      required = false,
      fullWidth = false,
      type = 'text',
      containerClassName = '',
      className = '',
      disabled = false,
      ...rest
    },
    ref
  ) => {
    const hasError = Boolean(error);
    const fullWidthClass = fullWidth ? 'w-100' : '';

    const inputElement = (
      <Form.Control
        ref={ref}
        type={type}
        size={size}
        isInvalid={hasError}
        disabled={disabled}
        className={className}
        {...(rest as any)}
      />
    );

    const renderInput = () => {
      if (startIcon || endIcon) {
        return (
          <InputGroup size={size} className={hasError ? 'is-invalid' : ''}>
            {startIcon && <InputGroup.Text>{startIcon}</InputGroup.Text>}
            {inputElement}
            {endIcon && <InputGroup.Text>{endIcon}</InputGroup.Text>}
          </InputGroup>
        );
      }
      return inputElement;
    };

    return (
      <Form.Group className={`${fullWidthClass} ${containerClassName}`.trim()}>
        {label && (
          <Form.Label>
            {label}
            {required && <span className="text-danger ms-1">*</span>}
          </Form.Label>
        )}
        {renderInput()}
        {error && (
          <Form.Control.Feedback type="invalid" className="d-block">
            {error}
          </Form.Control.Feedback>
        )}
        {!error && helperText && (
          <Form.Text className="text-muted">{helperText}</Form.Text>
        )}
      </Form.Group>
    );
  }
);

Input.displayName = 'Input';

export default Input;
