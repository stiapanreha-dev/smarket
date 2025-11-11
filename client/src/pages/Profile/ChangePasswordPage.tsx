/**
 * Change Password Page
 *
 * User password change form with validation and security features:
 * - Current password verification
 * - Strong password requirements (min 8 chars, 1 uppercase, 1 number, 1 special char)
 * - Password match validation
 * - New password cannot be same as current password
 * - Password strength indicator (weak/medium/strong)
 * - Show/hide password toggles
 * - Success/error handling with toast notifications
 */

import React, { useState } from 'react';
import { Form, Row, Col, ProgressBar } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { changePassword } from '@/api/auth.api';

interface ChangePasswordFormData {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

// Password strength calculation
type PasswordStrength = 'weak' | 'medium' | 'strong';

const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;

  if (!password) return 'weak';

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Complexity checks
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
};

// Validation schema
const schema = yup.object().shape({
  current_password: yup
    .string()
    .required('Current password is required'),
  new_password: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .notOneOf(
      [yup.ref('current_password')],
      'New password must be different from current password'
    ),
  confirm_new_password: yup
    .string()
    .required('Please confirm your new password')
    .oneOf([yup.ref('new_password')], 'Passwords must match'),
});

export const ChangePasswordPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setError,
  } = useForm<ChangePasswordFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_new_password: '',
    },
  });

  // Watch new password for strength indicator
  const newPassword = watch('new_password');
  const passwordStrength = calculatePasswordStrength(newPassword || '');

  // Get strength indicator color and variant
  const getStrengthDetails = (
    strength: PasswordStrength
  ): { variant: 'danger' | 'warning' | 'success'; value: number; label: string } => {
    switch (strength) {
      case 'weak':
        return { variant: 'danger', value: 33, label: 'Weak' };
      case 'medium':
        return { variant: 'warning', value: 66, label: 'Medium' };
      case 'strong':
        return { variant: 'success', value: 100, label: 'Strong' };
    }
  };

  const strengthDetails = getStrengthDetails(passwordStrength);

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setIsSubmitting(true);

      await changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });

      // Show success message
      toast.success('Password changed successfully');

      // Clear form
      reset();
    } catch (error: any) {
      console.error('Failed to change password:', error);

      // Handle specific error: incorrect current password
      if (error?.response?.status === 401 || error?.response?.status === 400) {
        setError('current_password', {
          type: 'manual',
          message: 'Current password is incorrect',
        });
        toast.error('Current password is incorrect');
      } else {
        toast.error(
          error?.response?.data?.message || 'Failed to change password. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="mb-4">Change Password</h3>
      <p className="text-muted mb-4">
        Update your password to keep your account secure. Make sure your new password is strong and unique.
      </p>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Row>
          <Col md={8} lg={6}>
            {/* Current Password */}
            <Form.Group className="mb-3">
              <Form.Label>
                Current Password <span className="text-danger">*</span>
              </Form.Label>
              <div className="position-relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter your current password"
                  error={errors.current_password?.message}
                  startIcon={<FiLock />}
                  fullWidth
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  {...register('current_password')}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                  style={{ zIndex: 10, marginTop: '-12px' }}
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={isSubmitting}
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? (
                    <FiEyeOff size={18} className="text-muted" />
                  ) : (
                    <FiEye size={18} className="text-muted" />
                  )}
                </button>
              </div>
            </Form.Group>

            {/* New Password */}
            <Form.Group className="mb-3">
              <Form.Label>
                New Password <span className="text-danger">*</span>
              </Form.Label>
              <div className="position-relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  error={errors.new_password?.message}
                  startIcon={<FiLock />}
                  fullWidth
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  {...register('new_password')}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                  style={{ zIndex: 10, marginTop: '-12px' }}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isSubmitting}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? (
                    <FiEyeOff size={18} className="text-muted" />
                  ) : (
                    <FiEye size={18} className="text-muted" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted">Password Strength:</small>
                    <small className={`fw-semibold text-${strengthDetails.variant}`}>
                      {strengthDetails.label}
                    </small>
                  </div>
                  <ProgressBar
                    variant={strengthDetails.variant}
                    now={strengthDetails.value}
                    style={{ height: '6px' }}
                  />
                </div>
              )}

              {/* Password Requirements */}
              <small className="text-muted d-block mt-2">
                Password must contain:
                <ul className="mb-0 mt-1" style={{ fontSize: '0.85rem' }}>
                  <li>At least 8 characters</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one number</li>
                  <li>At least one special character</li>
                </ul>
              </small>
            </Form.Group>

            {/* Confirm New Password */}
            <Form.Group className="mb-4">
              <Form.Label>
                Confirm New Password <span className="text-danger">*</span>
              </Form.Label>
              <div className="position-relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  error={errors.confirm_new_password?.message}
                  startIcon={<FiLock />}
                  fullWidth
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  {...register('confirm_new_password')}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                  style={{ zIndex: 10, marginTop: '-12px' }}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff size={18} className="text-muted" />
                  ) : (
                    <FiEye size={18} className="text-muted" />
                  )}
                </button>
              </div>
            </Form.Group>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Change Password
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default ChangePasswordPage;
