/**
 * DatePicker Component
 *
 * Styled date picker using react-datepicker with Bootstrap styling
 */

import ReactDatePicker from 'react-datepicker';
import { Form } from 'react-bootstrap';
import 'react-datepicker/dist/react-datepicker.css';

export interface DatePickerProps {
  /** Selected date value */
  selected: Date | null;

  /** Change handler */
  onChange: (date: Date | null) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Input label */
  label?: string;

  /** Error message */
  error?: string;

  /** Is the field required */
  required?: boolean;

  /** Additional className */
  className?: string;

  /** Container className */
  containerClassName?: string;

  /** Date format */
  dateFormat?: string;

  /** Minimum date */
  minDate?: Date;

  /** Maximum date */
  maxDate?: Date;

  /** Disabled state */
  disabled?: boolean;

  /** Show time picker */
  showTimeSelect?: boolean;

  /** Is clearable */
  isClearable?: boolean;
}

/**
 * Styled DatePicker with Bootstrap form styling
 */
export const DatePicker = ({
  selected,
  onChange,
  placeholder = 'Select date',
  label,
  error,
  required = false,
  className = '',
  containerClassName = '',
  dateFormat = 'dd.MM.yyyy',
  minDate,
  maxDate,
  disabled = false,
  showTimeSelect = false,
  isClearable = true,
}: DatePickerProps) => {
  const hasError = Boolean(error);

  return (
    <Form.Group className={containerClassName}>
      {label && (
        <Form.Label>
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </Form.Label>
      )}
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        placeholderText={placeholder}
        className={`form-control ${hasError ? 'is-invalid' : ''} ${className}`.trim()}
        dateFormat={dateFormat}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        showTimeSelect={showTimeSelect}
        isClearable={isClearable}
        autoComplete="off"
      />
      {error && (
        <Form.Control.Feedback type="invalid" className="d-block">
          {error}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
};

export default DatePicker;
