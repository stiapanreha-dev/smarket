/**
 * Settings Page
 *
 * User settings management page with sections for:
 * - Language & Region
 * - Notifications
 * - Privacy
 */

import React, { useState } from 'react';
import { Form, Row, Col, Spinner } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import { updateProfile } from '@/api/profile.api';
import type { UpdateProfileRequest, UserLocale, UserCurrency } from '@/types';

interface SettingsFormData {
  // Language & Region
  locale: UserLocale;
  currency: UserCurrency;

  // Notifications
  email_notifications: boolean;
  order_updates: boolean;
  promotions: boolean;
  newsletter: boolean;

  // Privacy
  profile_visibility: 'public' | 'private';
  show_email: boolean;
  show_phone: boolean;
}

// Validation schema
const schema = yup.object().shape({
  locale: yup.string().oneOf(['en', 'ru', 'ar']).required('Language is required'),
  currency: yup.string().oneOf(['USD', 'EUR', 'RUB', 'AED']).required('Currency is required'),
  email_notifications: yup.boolean(),
  order_updates: yup.boolean(),
  promotions: yup.boolean(),
  newsletter: yup.boolean(),
  profile_visibility: yup.string().oneOf(['public', 'private']),
  show_email: yup.boolean(),
  show_phone: yup.boolean(),
});

export const SettingsPage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { i18n, t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract settings from user metadata or use defaults
  const userMetadata = user?.metadata || {};
  const notificationSettings = userMetadata.notifications || {};
  const privacySettings = userMetadata.privacy || {};

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
  } = useForm<SettingsFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      locale: user?.locale || 'en',
      currency: user?.currency || 'USD',
      email_notifications: notificationSettings.email_notifications ?? true,
      order_updates: notificationSettings.order_updates ?? true,
      promotions: notificationSettings.promotions ?? false,
      newsletter: notificationSettings.newsletter ?? false,
      profile_visibility: privacySettings.profile_visibility || 'public',
      show_email: privacySettings.show_email ?? false,
      show_phone: privacySettings.show_phone ?? false,
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    try {
      setIsSubmitting(true);

      // Prepare metadata object
      const metadata = {
        notifications: {
          email_notifications: data.email_notifications,
          order_updates: data.order_updates,
          promotions: data.promotions,
          newsletter: data.newsletter,
        },
        privacy: {
          profile_visibility: data.profile_visibility,
          show_email: data.show_email,
          show_phone: data.show_phone,
        },
      };

      // Prepare update payload
      const updateData: UpdateProfileRequest = {
        locale: data.locale,
        currency: data.currency,
        metadata,
      };

      // Call API to update profile
      const updatedUser = await updateProfile(updateData);

      // Update auth store
      setUser(updatedUser);

      // Update i18n language if changed
      if (data.locale !== user?.locale) {
        await i18n.changeLanguage(data.locale);
      }

      // Show success message
      toast.success(t('settings.messages.saved'));
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error(
        error instanceof Error ? error.message : t('settings.messages.error')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="mb-4">{t('settings.title')}</h3>

      <Form onSubmit={handleSubmit(onSubmit)}>
        {/* Language & Region Section */}
        <div className="mb-5">
          <h5 className="mb-3">{t('settings.sections.languageRegion')}</h5>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  {t('settings.fields.language')} <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="locale"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.locale}
                        disabled={isSubmitting}
                      >
                        <option value="en">English</option>
                        <option value="ru">Русский</option>
                        <option value="ar">العربية</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.locale?.message}
                      </Form.Control.Feedback>
                    </>
                  )}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  {t('settings.fields.currency')} <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.currency}
                        disabled={isSubmitting}
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="RUB">RUB - Russian Ruble</option>
                        <option value="AED">AED - UAE Dirham</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.currency?.message}
                      </Form.Control.Feedback>
                    </>
                  )}
                />
              </Form.Group>
            </Col>
          </Row>

          <small className="text-muted">
            {t('settings.hints.languageRegion')}
          </small>
        </div>

        {/* Notifications Section */}
        <div className="mb-5">
          <h5 className="mb-3">{t('settings.sections.notifications')}</h5>

          <Form.Group className="mb-3">
            <Controller
              name="email_notifications"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <Form.Check
                  {...field}
                  type="switch"
                  id="email-notifications-switch"
                  label={t('settings.fields.emailNotifications')}
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  disabled={isSubmitting}
                />
              )}
            />
            <Form.Text className="text-muted">
              {t('settings.hints.emailNotifications')}
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Controller
              name="order_updates"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <Form.Check
                  {...field}
                  type="checkbox"
                  id="order-updates-checkbox"
                  label={t('settings.fields.orderUpdates')}
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  disabled={isSubmitting || !watch('email_notifications')}
                />
              )}
            />
            <Form.Text className="text-muted">
              {t('settings.hints.orderUpdates')}
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Controller
              name="promotions"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <Form.Check
                  {...field}
                  type="checkbox"
                  id="promotions-checkbox"
                  label={t('settings.fields.promotions')}
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  disabled={isSubmitting || !watch('email_notifications')}
                />
              )}
            />
            <Form.Text className="text-muted">
              {t('settings.hints.promotions')}
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Controller
              name="newsletter"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <Form.Check
                  {...field}
                  type="checkbox"
                  id="newsletter-checkbox"
                  label={t('settings.fields.newsletter')}
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  disabled={isSubmitting || !watch('email_notifications')}
                />
              )}
            />
            <Form.Text className="text-muted">
              {t('settings.hints.newsletter')}
            </Form.Text>
          </Form.Group>
        </div>

        {/* Privacy Section */}
        <div className="mb-5">
          <h5 className="mb-3">{t('settings.sections.privacy')}</h5>

          <Form.Group className="mb-3">
            <Form.Label>{t('settings.fields.profileVisibility')}</Form.Label>
            <Controller
              name="profile_visibility"
              control={control}
              render={({ field }) => (
                <div>
                  <Form.Check
                    {...field}
                    type="radio"
                    id="profile-public"
                    label={t('settings.options.public')}
                    value="public"
                    checked={field.value === 'public'}
                    disabled={isSubmitting}
                  />
                  <Form.Check
                    {...field}
                    type="radio"
                    id="profile-private"
                    label={t('settings.options.private')}
                    value="private"
                    checked={field.value === 'private'}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            />
            <Form.Text className="text-muted">
              {t('settings.hints.profileVisibility')}
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Controller
              name="show_email"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <Form.Check
                  {...field}
                  type="checkbox"
                  id="show-email-checkbox"
                  label={t('settings.fields.showEmail')}
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  disabled={isSubmitting || watch('profile_visibility') === 'private'}
                />
              )}
            />
            <Form.Text className="text-muted">
              {t('settings.hints.showEmail')}
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Controller
              name="show_phone"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <Form.Check
                  {...field}
                  type="checkbox"
                  id="show-phone-checkbox"
                  label={t('settings.fields.showPhone')}
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  disabled={isSubmitting || watch('profile_visibility') === 'private'}
                />
              )}
            />
            <Form.Text className="text-muted">
              {t('settings.hints.showPhone')}
            </Form.Text>
          </Form.Group>
        </div>

        {/* Submit Button */}
        <div className="mt-4">
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!isDirty || isSubmitting}
          >
            {t('settings.buttons.save')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default SettingsPage;
