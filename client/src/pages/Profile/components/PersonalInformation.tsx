/**
 * Personal Information Section
 *
 * Editable personal information form with avatar upload
 * Uses React Hook Form for form management and validation
 */

import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Spinner } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { FaCamera } from 'react-icons/fa';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { DatePicker } from '@/components/common/DatePicker';
import { useAuthStore } from '@/store/authStore';
import { updateProfile } from '@/api/profile.api';
import type { UpdateProfileRequest } from '@/types';

/**
 * Safely parse and normalize date to YYYY-MM-DD format
 * Handles ISO strings, Date objects, and various date formats
 */
const normalizeDate = (dateValue: string | Date | null | undefined): string => {
  if (!dateValue) return '';

  try {
    // If already in YYYY-MM-DD format, return as is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    const date = new Date(dateValue);

    // Check for Invalid Date
    if (isNaN(date.getTime())) {
      return '';
    }

    // Return in YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Safely parse date string to Date object
 * Returns null if invalid
 */
const safeParseDate = (dateValue: string | null | undefined): Date | null => {
  if (!dateValue) return null;

  try {
    const date = new Date(dateValue);

    // Check for Invalid Date
    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
};

interface PersonalInfoFormData {
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  avatar_url?: string;
}

// Validation schema
const schema = yup.object().shape({
  first_name: yup
    .string()
    .required('First name is required')
    .max(100, 'First name must be at most 100 characters'),
  last_name: yup
    .string()
    .required('Last name is required')
    .max(100, 'Last name must be at most 100 characters'),
  phone: yup
    .string()
    .matches(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
    .notRequired()
    .nullable(),
  date_of_birth: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .notRequired()
    .nullable(),
  avatar_url: yup
    .string()
    .url('Please enter a valid URL')
    .notRequired()
    .nullable(),
});

export const PersonalInformation: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>(
    user?.avatar_url || 'https://ui-avatars.com/api/?name=User&size=150&background=7FB3D5&color=fff'
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    reset,
  } = useForm<PersonalInfoFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      date_of_birth: normalizeDate(user?.date_of_birth),
      avatar_url: user?.avatar_url || '',
    },
  });

  // Fetch fresh profile data from server on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { getProfile } = await import('@/api/profile.api');
        const freshUser = await getProfile();
        // Update auth store with fresh data
        setUser(freshUser);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    fetchProfile();
  }, [setUser]);

  // Reset form when user data changes (e.g., after page reload or login)
  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        date_of_birth: normalizeDate(user.date_of_birth),
        avatar_url: user.avatar_url || '',
      });
      setAvatarPreview(
        user.avatar_url || 'https://ui-avatars.com/api/?name=User&size=150&background=7FB3D5&color=fff'
      );
    }
  }, [user, reset]);

  const handleAvatarUrlChange = (url: string) => {
    setValue('avatar_url', url, { shouldDirty: true });
    setAvatarPreview(url || 'https://ui-avatars.com/api/?name=User&size=150&background=7FB3D5&color=fff');
  };

  const handleImageError = () => {
    setAvatarPreview('https://ui-avatars.com/api/?name=User&size=150&background=7FB3D5&color=fff');
  };

  const onSubmit = async (data: PersonalInfoFormData) => {
    try {
      setIsSubmitting(true);

      // Prepare update payload
      const updateData: UpdateProfileRequest = {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || undefined,
        date_of_birth: data.date_of_birth || undefined,
        avatar_url: data.avatar_url || undefined,
      };

      // Call API to update profile
      const updatedUser = await updateProfile(updateData);

      // Update auth store
      setUser(updatedUser);

      // Show success message
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
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
      <h3 className="mb-4">Personal Information</h3>

      <Form onSubmit={handleSubmit(onSubmit)}>
        {/* Avatar Section */}
        <div className="text-center mb-4">
          <div className="avatar-upload-container">
            <img
              src={avatarPreview}
              alt="Avatar"
              className="avatar-preview"
              onError={handleImageError}
            />
            <div className="avatar-upload-overlay" title="Change avatar URL">
              <FaCamera />
            </div>
          </div>
          <Controller
            name="avatar_url"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="url"
                label="Avatar URL"
                placeholder="https://example.com/avatar.jpg"
                error={errors.avatar_url?.message}
                containerClassName="mt-3"
                onChange={(e) => {
                  field.onChange(e);
                  handleAvatarUrlChange(e.target.value);
                }}
              />
            )}
          />
          <small className="text-muted">
            Enter a URL to your avatar image (e.g., from Gravatar or another service)
          </small>
        </div>

        {/* Name Fields */}
        <Row>
          <Col md={6}>
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="First Name"
                  placeholder="John"
                  error={errors.first_name?.message}
                  required
                  fullWidth
                />
              )}
            />
          </Col>
          <Col md={6}>
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Last Name"
                  placeholder="Doe"
                  error={errors.last_name?.message}
                  required
                  fullWidth
                />
              )}
            />
          </Col>
        </Row>

        {/* Email (Read-only) */}
        <Input
          label="Email"
          value={user.email}
          disabled
          fullWidth
          helperText="Email cannot be changed here. Contact support if needed."
        />

        {/* Phone */}
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="tel"
              label="Phone"
              placeholder="+1234567890"
              error={errors.phone?.message}
              fullWidth
            />
          )}
        />

        {/* Date of Birth */}
        <Controller
          name="date_of_birth"
          control={control}
          render={({ field }) => (
            <DatePicker
              selected={safeParseDate(field.value)}
              onChange={(date) => {
                field.onChange(date ? date.toISOString().split('T')[0] : '');
              }}
              label="Date of Birth"
              error={errors.date_of_birth?.message}
              maxDate={new Date()}
              containerClassName="mb-3"
            />
          )}
        />

        {/* Submit Button */}
        <div className="mt-4">
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!isDirty || isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default PersonalInformation;
