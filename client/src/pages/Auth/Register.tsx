import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Form, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FiMail, FiLock, FiUser, FiAlertCircle, FiGlobe, FiDollarSign } from 'react-icons/fi';

import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { Button, Input, Alert } from '@/components/common';
import type { UserLocale, UserCurrency } from '@/types';

/**
 * Register Form Data
 */
interface RegisterFormData {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  locale: UserLocale;
  currency: UserCurrency;
  terms: boolean;
}

/**
 * Register Page Component
 *
 * Features:
 * - React Hook Form + Yup validation
 * - Email, password, confirm password, first name, last name fields
 * - Language and currency selectors
 * - Terms & conditions checkbox
 * - Password validation: min 8 chars, 1 uppercase, 1 number
 * - Passwords match validation
 * - Loading state during registration
 * - Error handling with user-friendly messages
 * - Automatic login and redirect to /catalog after successful registration
 * - Link to login page
 * - Responsive design with Bootstrap grid
 * - Multi-language support (en/ru/ar)
 */
const Register: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error, isAuthenticated, clearError } = useAuthStore();

  // Validation schema
  const registerSchema = yup.object().shape({
    email: yup
      .string()
      .required(t('auth.validation.emailRequired'))
      .email(t('auth.validation.emailInvalid')),
    password: yup
      .string()
      .required(t('auth.validation.passwordRequired'))
      .min(8, t('auth.validation.passwordMin'))
      .matches(/[A-Z]/, t('auth.validation.passwordUppercase'))
      .matches(/[0-9]/, t('auth.validation.passwordNumber')),
    confirm_password: yup
      .string()
      .required(t('auth.validation.confirmPasswordRequired'))
      .oneOf([yup.ref('password')], t('auth.validation.passwordsMismatch')),
    first_name: yup
      .string()
      .required(t('auth.validation.firstNameRequired'))
      .trim()
      .min(1, t('auth.validation.firstNameRequired')),
    last_name: yup
      .string()
      .required(t('auth.validation.lastNameRequired'))
      .trim()
      .min(1, t('auth.validation.lastNameRequired')),
    locale: yup
      .string()
      .oneOf(['en', 'ru', 'ar'] as const)
      .default('en'),
    currency: yup
      .string()
      .oneOf(['USD', 'EUR', 'RUB', 'AED'] as const)
      .default('USD'),
    terms: yup
      .boolean()
      .oneOf([true], t('auth.validation.termsRequired'))
      .required(t('auth.validation.termsRequired')),
  });

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirm_password: '',
      first_name: '',
      last_name: '',
      locale: (i18n.language as UserLocale) || 'en',
      currency: 'USD',
      terms: false,
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/catalog');
    }
  }, [isAuthenticated, navigate]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError();

      // Prepare registration data
      const registrationData = {
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        locale: data.locale,
        currency: data.currency,
      };

      // Register user
      await registerUser(registrationData);

      // Load user's wishlist and cart from backend
      useWishlistStore.getState().loadWishlist().catch(console.error);
      useCartStore.getState().loadCart().catch(console.error);

      // Update i18n language to match user preference
      if (data.locale) {
        i18n.changeLanguage(data.locale);
      }

      // Redirect to catalog on success (automatic login is handled in authStore)
      navigate('/catalog');
    } catch (err) {
      // Error is already set in the store, but we can add form-specific errors
      const error = err as { response?: { status?: number; data?: { message?: string } } };

      if (error?.response?.status === 409) {
        // Email already exists
        setFormError('email', {
          type: 'manual',
          message: t('auth.errors.emailExists'),
        });
      }
    }
  };

  // Language options
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'ru', label: 'Русский' },
    { value: 'ar', label: 'العربية' },
  ];

  // Currency options
  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'RUB', label: 'RUB (₽)' },
    { value: 'AED', label: 'AED (د.إ)' },
  ];

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light py-5">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={7} xl={6}>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4 p-md-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <h1 className="h3 mb-2 fw-bold">{t('auth.register.title')}</h1>
                  <p className="text-muted">{t('auth.register.subtitle')}</p>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert
                    variant="danger"
                    dismissible
                    onClose={clearError}
                    icon={<FiAlertCircle size={20} />}
                    className="mb-4"
                  >
                    {error}
                  </Alert>
                )}

                {/* Register Form */}
                <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                  {/* Name Fields Row */}
                  <Row>
                    <Col md={6}>
                      <Input
                        label={t('auth.register.firstName')}
                        type="text"
                        placeholder={t('auth.register.firstNamePlaceholder')}
                        error={errors.first_name?.message}
                        startIcon={<FiUser />}
                        fullWidth
                        required
                        disabled={isLoading}
                        containerClassName="mb-3"
                        autoComplete="given-name"
                        {...register('first_name')}
                      />
                    </Col>
                    <Col md={6}>
                      <Input
                        label={t('auth.register.lastName')}
                        type="text"
                        placeholder={t('auth.register.lastNamePlaceholder')}
                        error={errors.last_name?.message}
                        startIcon={<FiUser />}
                        fullWidth
                        required
                        disabled={isLoading}
                        containerClassName="mb-3"
                        autoComplete="family-name"
                        {...register('last_name')}
                      />
                    </Col>
                  </Row>

                  {/* Email Field */}
                  <Input
                    label={t('auth.register.email')}
                    type="email"
                    placeholder={t('auth.register.emailPlaceholder')}
                    error={errors.email?.message}
                    startIcon={<FiMail />}
                    fullWidth
                    required
                    disabled={isLoading}
                    containerClassName="mb-3"
                    autoComplete="email"
                    {...register('email')}
                  />

                  {/* Password Fields Row */}
                  <Row>
                    <Col md={6}>
                      <Input
                        label={t('auth.register.password')}
                        type="password"
                        placeholder={t('auth.register.passwordPlaceholder')}
                        error={errors.password?.message}
                        startIcon={<FiLock />}
                        fullWidth
                        required
                        disabled={isLoading}
                        containerClassName="mb-3"
                        autoComplete="new-password"
                        {...register('password')}
                      />
                    </Col>
                    <Col md={6}>
                      <Input
                        label={t('auth.register.confirmPassword')}
                        type="password"
                        placeholder={t('auth.register.confirmPasswordPlaceholder')}
                        error={errors.confirm_password?.message}
                        startIcon={<FiLock />}
                        fullWidth
                        required
                        disabled={isLoading}
                        containerClassName="mb-3"
                        autoComplete="new-password"
                        {...register('confirm_password')}
                      />
                    </Col>
                  </Row>

                  {/* Language and Currency Row */}
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          {t('auth.register.language')} <span className="text-danger">*</span>
                        </Form.Label>
                        <div className="position-relative">
                          <FiGlobe
                            className="position-absolute"
                            style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
                            size={18}
                          />
                          <Form.Select
                            {...register('locale')}
                            disabled={isLoading}
                            isInvalid={!!errors.locale}
                            style={{ paddingLeft: '40px' }}
                          >
                            {languageOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Form.Select>
                          {errors.locale && (
                            <Form.Control.Feedback type="invalid">
                              {errors.locale.message}
                            </Form.Control.Feedback>
                          )}
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          {t('auth.register.currency')} <span className="text-danger">*</span>
                        </Form.Label>
                        <div className="position-relative">
                          <FiDollarSign
                            className="position-absolute"
                            style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
                            size={18}
                          />
                          <Form.Select
                            {...register('currency')}
                            disabled={isLoading}
                            isInvalid={!!errors.currency}
                            style={{ paddingLeft: '40px' }}
                          >
                            {currencyOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Form.Select>
                          {errors.currency && (
                            <Form.Control.Feedback type="invalid">
                              {errors.currency.message}
                            </Form.Control.Feedback>
                          )}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Terms & Conditions */}
                  <Form.Group className="mb-4">
                    <Form.Check
                      type="checkbox"
                      id="terms"
                      label={t('auth.register.terms')}
                      disabled={isLoading}
                      isInvalid={!!errors.terms}
                      feedback={errors.terms?.message}
                      feedbackType="invalid"
                      {...register('terms')}
                    />
                  </Form.Group>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    disabled={isLoading}
                    className="mb-3"
                  >
                    {t('auth.register.submit')}
                  </Button>

                  {/* Divider */}
                  <div className="position-relative my-4">
                    <hr className="text-muted" />
                    <span
                      className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small"
                    >
                      {t('auth.register.or')}
                    </span>
                  </div>

                  {/* Login Link */}
                  <div className="text-center">
                    <span className="text-muted me-2">
                      {t('auth.register.hasAccount')}
                    </span>
                    <Link
                      to="/login"
                      className="text-primary text-decoration-none fw-semibold"
                    >
                      {t('auth.register.login')}
                    </Link>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register;
