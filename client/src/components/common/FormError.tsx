import React from 'react';
import { Alert } from 'react-bootstrap';

interface FormErrorProps {
  /**
   * Error message to display
   */
  message?: string;

  /**
   * Whether to show the error
   */
  show?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Field-level form error component
 * Displays validation errors below form inputs
 */
export const FieldError: React.FC<FormErrorProps> = ({ message, show = true, className = '' }) => {
  if (!show || !message) {
    return null;
  }

  return (
    <div className={`text-danger small mt-1 ${className}`} role="alert">
      {message}
    </div>
  );
};

interface FormErrorSummaryProps {
  /**
   * Array of error messages or error object
   */
  errors: string[] | Record<string, string>;

  /**
   * Whether to show the summary
   */
  show?: boolean;

  /**
   * Title for the error summary
   */
  title?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Callback when user clicks on an error (for scrolling to field)
   */
  onErrorClick?: (field: string) => void;
}

/**
 * Form error summary component
 * Displays all validation errors at the top of a form
 */
export const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({
  errors,
  show = true,
  title = 'Please correct the following errors:',
  className = '',
  onErrorClick,
}) => {
  if (!show) {
    return null;
  }

  // Convert errors to array format
  const errorList: Array<{ field: string; message: string }> = Array.isArray(errors)
    ? errors.map((msg) => ({ field: '', message: msg }))
    : Object.entries(errors).map(([field, message]) => ({ field, message }));

  if (errorList.length === 0) {
    return null;
  }

  return (
    <Alert variant="danger" className={className}>
      <Alert.Heading className="h6 mb-2">{title}</Alert.Heading>
      <ul className="mb-0 ps-3">
        {errorList.map((error, index) => (
          <li key={index}>
            {error.field && onErrorClick ? (
              <button
                type="button"
                className="btn btn-link p-0 text-danger text-decoration-none"
                onClick={() => onErrorClick(error.field)}
              >
                <strong>{error.field}:</strong> {error.message}
              </button>
            ) : (
              <>
                {error.field && <strong>{error.field}: </strong>}
                {error.message}
              </>
            )}
          </li>
        ))}
      </ul>
    </Alert>
  );
};

/**
 * Inline error component for displaying errors next to labels
 */
interface InlineErrorProps {
  message?: string;
  show?: boolean;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, show = true }) => {
  if (!show || !message) {
    return null;
  }

  return (
    <span className="text-danger ms-2 small" role="alert">
      ({message})
    </span>
  );
};

/**
 * Utility function to scroll to first error field
 */
export const scrollToError = (fieldName: string): void => {
  const element = document.querySelector(`[name="${fieldName}"]`) as HTMLElement;
  if (element) {
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

/**
 * Hook for managing form errors with automatic scrolling
 */
export const useFormErrors = () => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const setFieldError = React.useCallback((field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  const clearFieldError = React.useCallback((field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = React.useCallback(() => {
    setErrors({});
  }, []);

  const setMultipleErrors = React.useCallback((newErrors: Record<string, string>) => {
    setErrors(newErrors);

    // Scroll to first error
    const firstErrorField = Object.keys(newErrors)[0];
    if (firstErrorField) {
      setTimeout(() => scrollToError(firstErrorField), 100);
    }
  }, []);

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    hasErrors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    setMultipleErrors,
    scrollToError,
  };
};

export default FieldError;
