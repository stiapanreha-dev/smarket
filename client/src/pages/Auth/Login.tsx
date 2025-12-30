import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Form, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';

import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { Button, Input, Alert } from '@/components/common';

/**
 * Login Form Data
 */
interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Login Page Component
 *
 * Features:
 * - React Hook Form + Yup validation
 * - Email and password fields
 * - "Remember me" checkbox
 * - Loading state during authentication
 * - Error handling with user-friendly messages
 * - Redirect to /catalog after successful login
 * - Links to forgot password and registration
 * - Responsive design with Bootstrap grid
 * - Multi-language support (en/ru/ar)
 */
const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading, error, isAuthenticated, clearError } = useAuthStore();

  // Get return URL from query params (for redirect after login)
  const returnUrl = searchParams.get('returnUrl');

  // Validation schema
  const loginSchema = yup.object().shape({
    email: yup
      .string()
      .required(t('auth.validation.emailRequired'))
      .email(t('auth.validation.emailInvalid')),
    password: yup
      .string()
      .required(t('auth.validation.passwordRequired'))
      .min(6, t('auth.validation.passwordMin')),
    rememberMe: yup.boolean().default(false),
  });

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to returnUrl if provided, otherwise to catalog
      const redirectTo = returnUrl ? decodeURIComponent(returnUrl) : '/catalog';
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, returnUrl]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data.email, data.password);

      // Load user's wishlist and cart from backend
      useWishlistStore.getState().loadWishlist().catch(console.error);
      useCartStore.getState().loadCart().catch(console.error);

      // If rememberMe is true, store preference (optional feature for future)
      if (data.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      // Redirect to returnUrl if provided, otherwise to catalog
      const redirectTo = returnUrl ? decodeURIComponent(returnUrl) : '/catalog';
      navigate(redirectTo);
    } catch (err) {
      // Error is already set in the store, but we can add form-specific errors
      const error = err as { response?: { status?: number } };
      if (error?.response?.status === 401) {
        setFormError('email', {
          type: 'manual',
          message: t('auth.errors.invalidCredentials'),
        });
        setFormError('password', {
          type: 'manual',
          message: t('auth.errors.invalidCredentials'),
        });
      }
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={5}>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4 p-md-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <h1 className="h3 mb-2 fw-bold">{t('auth.login.title')}</h1>
                  <p className="text-muted">{t('auth.login.subtitle')}</p>
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

                {/* Login Form */}
                <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                  {/* Email Field */}
                  <Input
                    label={t('auth.login.email')}
                    type="email"
                    placeholder={t('auth.login.emailPlaceholder')}
                    error={errors.email?.message}
                    startIcon={<FiMail />}
                    fullWidth
                    required
                    disabled={isLoading}
                    containerClassName="mb-3"
                    autoComplete="email"
                    {...register('email')}
                  />

                  {/* Password Field */}
                  <Input
                    label={t('auth.login.password')}
                    type="password"
                    placeholder={t('auth.login.passwordPlaceholder')}
                    error={errors.password?.message}
                    startIcon={<FiLock />}
                    fullWidth
                    required
                    disabled={isLoading}
                    containerClassName="mb-3"
                    autoComplete="current-password"
                    {...register('password')}
                  />

                  {/* Remember Me & Forgot Password */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <Form.Check
                      type="checkbox"
                      id="rememberMe"
                      label={t('auth.login.rememberMe')}
                      disabled={isLoading}
                      {...register('rememberMe')}
                    />
                    <Link
                      to="/forgot-password"
                      className="text-primary text-decoration-none small"
                    >
                      {t('auth.login.forgotPassword')}
                    </Link>
                  </div>

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
                    {t('auth.login.submit')}
                  </Button>

                  {/* Divider */}
                  <div className="position-relative my-4">
                    <hr className="text-muted" />
                    <span
                      className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small"
                    >
                      {t('auth.login.or')}
                    </span>
                  </div>

                  {/* Register Link */}
                  <div className="text-center">
                    <span className="text-muted me-2">
                      {t('auth.login.noAccount')}
                    </span>
                    <Link
                      to="/register"
                      className="text-primary text-decoration-none fw-semibold"
                    >
                      {t('auth.login.register')}
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

export default Login;
