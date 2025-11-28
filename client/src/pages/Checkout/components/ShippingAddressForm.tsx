/**
 * Shipping Address Form Component
 *
 * Form for entering shipping address with validation:
 * - Full name, Phone
 * - Address line 1, Address line 2
 * - City, State/Province, Postal code, Country
 * - Save to my addresses checkbox
 *
 * Uses React Hook Form + Yup validation
 */

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import type { ShippingAddressFormData } from '@/types';
import './ShippingAddressForm.css';

// Validation schema
const shippingAddressSchema = yup.object().shape({
  fullName: yup
    .string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
      'Phone number is not valid'
    ),
  addressLine1: yup
    .string()
    .required('Address line 1 is required')
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must not exceed 200 characters'),
  addressLine2: yup
    .string()
    .max(200, 'Address must not exceed 200 characters')
    .notRequired(),
  city: yup
    .string()
    .required('City is required')
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must not exceed 100 characters'),
  state: yup
    .string()
    .max(100, 'State must not exceed 100 characters')
    .notRequired(),
  postalCode: yup
    .string()
    .required('Postal code is required')
    .matches(/^[A-Z0-9\s-]{3,10}$/i, 'Postal code is not valid'),
  country: yup
    .string()
    .required('Country is required')
    .length(2, 'Country code must be 2 characters'),
  saveAddress: yup.boolean().notRequired(),
});

interface ShippingAddressFormProps {
  initialData?: Partial<ShippingAddressFormData>;
  onSubmit: (data: ShippingAddressFormData) => void | Promise<void>;
  onBack?: () => void;
  isLoading?: boolean;
  isNewAddress?: boolean;
}

export function ShippingAddressForm({
  initialData,
  onSubmit,
  onBack,
  isLoading = false,
  isNewAddress = true,
}: ShippingAddressFormProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Initialize form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(shippingAddressSchema) as any,
    defaultValues: {
      fullName: initialData?.fullName || '',
      phone: initialData?.phone || '',
      addressLine1: initialData?.addressLine1 || '',
      addressLine2: initialData?.addressLine2 || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      postalCode: initialData?.postalCode || '',
      country: initialData?.country || 'US',
      saveAddress: initialData?.saveAddress || false,
    },
  });

  // Handle form submission
  const handleFormSubmit = async (data: ShippingAddressFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit shipping address:', error);
    }
  };

  const disabled = isLoading || isSubmitting;

  return (
    <Form onSubmit={handleSubmit(handleFormSubmit)} className="shipping-address-form">
      {/* Contact Information */}
      <div className="form-section">
        <h5 className="form-section-title">
          {t('checkout.shippingAddress.contactInfo', 'Contact Information')}
        </h5>

        <Row className="g-3">
          {/* Full Name */}
          <Col md={6}>
            <Form.Group controlId="fullName">
              <Form.Label>
                {t('checkout.shippingAddress.fullName', 'Full Name')} <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder={t('checkout.shippingAddress.fullNamePlaceholder', 'John Doe')}
                {...register('fullName')}
                isInvalid={!!errors.fullName}
                disabled={disabled}
              />
              {errors.fullName && (
                <Form.Control.Feedback type="invalid">
                  {errors.fullName.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Col>

          {/* Phone */}
          <Col md={6}>
            <Form.Group controlId="phone">
              <Form.Label>
                {t('checkout.shippingAddress.phone', 'Phone')} <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="tel"
                placeholder={t('checkout.shippingAddress.phonePlaceholder', '+1 (555) 123-4567')}
                {...register('phone')}
                isInvalid={!!errors.phone}
                disabled={disabled}
              />
              {errors.phone && (
                <Form.Control.Feedback type="invalid">
                  {errors.phone.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Col>
        </Row>
      </div>

      {/* Shipping Address */}
      <div className="form-section">
        <h5 className="form-section-title">
          {t('checkout.shippingAddress.shippingAddress', 'Shipping Address')}
        </h5>

        <Row className="g-3">
          {/* Address Line 1 */}
          <Col xs={12}>
            <Form.Group controlId="addressLine1">
              <Form.Label>
                {t('checkout.shippingAddress.addressLine1', 'Address Line 1')} <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder={t('checkout.shippingAddress.addressLine1Placeholder', '123 Main Street')}
                {...register('addressLine1')}
                isInvalid={!!errors.addressLine1}
                disabled={disabled}
              />
              {errors.addressLine1 && (
                <Form.Control.Feedback type="invalid">
                  {errors.addressLine1.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Col>

          {/* Address Line 2 */}
          <Col xs={12}>
            <Form.Group controlId="addressLine2">
              <Form.Label>
                {t('checkout.shippingAddress.addressLine2', 'Address Line 2')} {t('common.optional', '(Optional)')}
              </Form.Label>
              <Form.Control
                type="text"
                placeholder={t('checkout.shippingAddress.addressLine2Placeholder', 'Apartment, suite, unit, etc.')}
                {...register('addressLine2')}
                isInvalid={!!errors.addressLine2}
                disabled={disabled}
              />
              {errors.addressLine2 && (
                <Form.Control.Feedback type="invalid">
                  {errors.addressLine2.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Col>

          {/* City */}
          <Col md={6}>
            <Form.Group controlId="city">
              <Form.Label>
                {t('checkout.shippingAddress.city', 'City')} <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder={t('checkout.shippingAddress.cityPlaceholder', 'New York')}
                {...register('city')}
                isInvalid={!!errors.city}
                disabled={disabled}
              />
              {errors.city && (
                <Form.Control.Feedback type="invalid">
                  {errors.city.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Col>

          {/* State/Province */}
          <Col md={6}>
            <Form.Group controlId="state">
              <Form.Label>
                {t('checkout.shippingAddress.state', 'State/Province')} {t('common.optional', '(Optional)')}
              </Form.Label>
              <Form.Control
                type="text"
                placeholder={t('checkout.shippingAddress.statePlaceholder', 'NY')}
                {...register('state')}
                isInvalid={!!errors.state}
                disabled={disabled}
              />
              {errors.state && (
                <Form.Control.Feedback type="invalid">
                  {errors.state.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Col>

          {/* Postal Code */}
          <Col md={6}>
            <Form.Group controlId="postalCode">
              <Form.Label>
                {t('checkout.shippingAddress.postalCode', 'Postal Code')} <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder={t('checkout.shippingAddress.postalCodePlaceholder', '10001')}
                {...register('postalCode')}
                isInvalid={!!errors.postalCode}
                disabled={disabled}
              />
              {errors.postalCode && (
                <Form.Control.Feedback type="invalid">
                  {errors.postalCode.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Col>

          {/* Country */}
          <Col md={6}>
            <Form.Group controlId="country">
              <Form.Label>
                {t('checkout.shippingAddress.country', 'Country')} <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                {...register('country')}
                isInvalid={!!errors.country}
                disabled={disabled}
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="RU">Russia</option>
                <option value="AE">United Arab Emirates</option>
                {/* Add more countries as needed */}
              </Form.Select>
              {errors.country && (
                <Form.Control.Feedback type="invalid">
                  {errors.country.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Col>
        </Row>
      </div>

      {/* Save Address Checkbox - only show for new addresses */}
      {isNewAddress && (
        <div className="form-section">
          <Form.Group controlId="saveAddress">
            <Form.Check
              type="checkbox"
              label={t('checkout.shippingAddress.saveAddress', 'Save this address to my account')}
              {...register('saveAddress')}
              disabled={disabled}
            />
          </Form.Group>
        </div>
      )}

      {/* Action Buttons */}
      <div className="form-actions">
        {onBack && (
          <Button variant="outline-secondary" onClick={onBack} disabled={disabled}>
            {isRTL ? <FaArrowRight className="ms-2" /> : <FaArrowLeft className="me-2" />}
            {t('checkout.backToCart', 'Back to Cart')}
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={disabled}>
          {disabled
            ? t('common.loading', 'Loading...')
            : t('checkout.continueToDelivery', 'Continue to Delivery')}
          {!disabled && (isRTL ? <FaArrowLeft className="ms-2" /> : <FaArrowRight className="ms-2" />)}
        </Button>
      </div>
    </Form>
  );
}
