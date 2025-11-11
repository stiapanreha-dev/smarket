/**
 * Address Modal Component
 *
 * Modal for adding or editing user addresses
 */

import { useState, useEffect } from 'react';
import { Modal, Form, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import type { UserAddress, AddressFormData, CreateAddressDto, UpdateAddressDto } from '@/types/address';
import { api } from '@/services/api';

// Validation schema
const addressSchema = yup.object().shape({
  full_name: yup
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
  address_line1: yup
    .string()
    .required('Address line 1 is required')
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must not exceed 200 characters'),
  address_line2: yup
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
  postal_code: yup
    .string()
    .required('Postal code is required')
    .matches(/^[A-Z0-9\s-]{3,10}$/i, 'Postal code is not valid'),
  country: yup
    .string()
    .required('Country is required')
    .length(2, 'Country code must be 2 characters'),
  is_default: yup.boolean().notRequired(),
});

interface AddressModalProps {
  show: boolean;
  mode: 'add' | 'edit';
  address?: UserAddress | null;
  onClose: () => void;
  onSave: () => void;
}

export function AddressModal({ show, mode, address, onClose, onSave }: AddressModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: yupResolver(addressSchema) as any,
  });

  // Reset form when modal opens/closes or address changes
  useEffect(() => {
    if (show) {
      if (mode === 'edit' && address) {
        reset({
          full_name: address.full_name,
          phone: address.phone,
          address_line1: address.address_line1,
          address_line2: address.address_line2 || '',
          city: address.city,
          state: address.state || '',
          postal_code: address.postal_code,
          country: address.country,
          is_default: address.is_default,
        });
      } else {
        reset({
          full_name: '',
          phone: '',
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'US',
          is_default: false,
        });
      }
      setError(null);
    }
  }, [show, mode, address, reset]);

  // Handle form submission
  const onSubmit = async (data: AddressFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (mode === 'add') {
        const createDto: CreateAddressDto = {
          full_name: data.full_name,
          phone: data.phone,
          address_line1: data.address_line1,
          address_line2: data.address_line2 || undefined,
          city: data.city,
          state: data.state || undefined,
          postal_code: data.postal_code,
          country: data.country,
          is_default: data.is_default,
        };
        await api.post('/users/me/addresses', createDto);
      } else if (mode === 'edit' && address) {
        const updateDto: UpdateAddressDto = {
          full_name: data.full_name,
          phone: data.phone,
          address_line1: data.address_line1,
          address_line2: data.address_line2 || undefined,
          city: data.city,
          state: data.state || undefined,
          postal_code: data.postal_code,
          country: data.country,
          is_default: data.is_default,
        };
        await api.patch(`/users/me/addresses/${address.id}`, updateDto);
      }

      onSave();
    } catch (err: any) {
      console.error('Failed to save address:', err);
      setError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered backdrop="static" keyboard={!loading}>
      <Modal.Header closeButton={!loading}>
        <Modal.Title>
          {mode === 'add'
            ? t('profile.addresses.addAddress', 'Add New Address')
            : t('profile.addresses.editAddress', 'Edit Address')}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
              {error}
            </Alert>
          )}

          {/* Contact Information */}
          <div className="mb-4">
            <h6 className="mb-3">{t('profile.addresses.contactInfo', 'Contact Information')}</h6>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="full_name">
                  <Form.Label>
                    {t('profile.addresses.fullName', 'Full Name')} <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('profile.addresses.fullNamePlaceholder', 'John Doe')}
                    {...register('full_name')}
                    isInvalid={!!errors.full_name}
                    disabled={loading}
                  />
                  {errors.full_name && (
                    <Form.Control.Feedback type="invalid">{errors.full_name.message}</Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="phone">
                  <Form.Label>
                    {t('profile.addresses.phone', 'Phone')} <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder={t('profile.addresses.phonePlaceholder', '+1 (555) 123-4567')}
                    {...register('phone')}
                    isInvalid={!!errors.phone}
                    disabled={loading}
                  />
                  {errors.phone && (
                    <Form.Control.Feedback type="invalid">{errors.phone.message}</Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Address Details */}
          <div className="mb-4">
            <h6 className="mb-3">{t('profile.addresses.addressDetails', 'Address Details')}</h6>
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group controlId="address_line1">
                  <Form.Label>
                    {t('profile.addresses.addressLine1', 'Address Line 1')} <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('profile.addresses.addressLine1Placeholder', '123 Main Street')}
                    {...register('address_line1')}
                    isInvalid={!!errors.address_line1}
                    disabled={loading}
                  />
                  {errors.address_line1 && (
                    <Form.Control.Feedback type="invalid">{errors.address_line1.message}</Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>

              <Col xs={12}>
                <Form.Group controlId="address_line2">
                  <Form.Label>
                    {t('profile.addresses.addressLine2', 'Address Line 2')}{' '}
                    {t('common.optional', '(Optional)')}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('profile.addresses.addressLine2Placeholder', 'Apartment, suite, unit, etc.')}
                    {...register('address_line2')}
                    isInvalid={!!errors.address_line2}
                    disabled={loading}
                  />
                  {errors.address_line2 && (
                    <Form.Control.Feedback type="invalid">{errors.address_line2.message}</Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="city">
                  <Form.Label>
                    {t('profile.addresses.city', 'City')} <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('profile.addresses.cityPlaceholder', 'New York')}
                    {...register('city')}
                    isInvalid={!!errors.city}
                    disabled={loading}
                  />
                  {errors.city && (
                    <Form.Control.Feedback type="invalid">{errors.city.message}</Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="state">
                  <Form.Label>
                    {t('profile.addresses.state', 'State/Province')} {t('common.optional', '(Optional)')}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('profile.addresses.statePlaceholder', 'NY')}
                    {...register('state')}
                    isInvalid={!!errors.state}
                    disabled={loading}
                  />
                  {errors.state && (
                    <Form.Control.Feedback type="invalid">{errors.state.message}</Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="postal_code">
                  <Form.Label>
                    {t('profile.addresses.postalCode', 'Postal Code')} <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('profile.addresses.postalCodePlaceholder', '10001')}
                    {...register('postal_code')}
                    isInvalid={!!errors.postal_code}
                    disabled={loading}
                  />
                  {errors.postal_code && (
                    <Form.Control.Feedback type="invalid">{errors.postal_code.message}</Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="country">
                  <Form.Label>
                    {t('profile.addresses.country', 'Country')} <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select {...register('country')} isInvalid={!!errors.country} disabled={loading}>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="RU">Russia</option>
                    <option value="AE">United Arab Emirates</option>
                  </Form.Select>
                  {errors.country && (
                    <Form.Control.Feedback type="invalid">{errors.country.message}</Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Default Address Checkbox */}
          <Form.Group controlId="is_default">
            <Form.Check
              type="checkbox"
              label={t('profile.addresses.setAsDefault', 'Set as default address')}
              {...register('is_default')}
              disabled={loading}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {t('common.saving', 'Saving...')}
              </>
            ) : (
              t('common.save', 'Save')
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
