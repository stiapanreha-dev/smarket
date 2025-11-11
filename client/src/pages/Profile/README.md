# Profile Page

User profile management page with sidebar navigation and editable sections.

## Features

### Personal Information Section
- **Avatar**: URL-based avatar with preview (upload functionality pending)
- **Name fields**: First name and last name (required)
- **Email**: Read-only display
- **Phone**: Optional phone number with validation
- **Date of Birth**: Optional date input
- **Form validation**: Using React Hook Form + Yup
- **Success toast**: Notification after successful save

### Sidebar Navigation
- Personal Information (implemented)
- Addresses (placeholder)
- Payment Methods (placeholder)
- Settings (placeholder)
- Security (placeholder)

## Usage

Navigate to `/profile` when authenticated to access the profile page.

```tsx
import { ProfilePage } from '@/pages/Profile';

// In router
<Route path="/profile" element={<ProfilePage />} />
```

## API Integration

The profile page uses the following API endpoints:

- `GET /api/v1/users/me` - Fetch current user profile
- `PUT /api/v1/users/me` - Update user profile

## Components

- `ProfilePage.tsx` - Main page component with layout
- `ProfileSidebar.tsx` - Navigation sidebar
- `PersonalInformation.tsx` - Personal info form section

## Future Enhancements

1. **Avatar Upload**: Implement actual file upload to S3
2. **Image Cropping**: Add react-image-crop for avatar cropping
3. **Address Management**: Implement saved addresses section
4. **Payment Methods**: Implement saved payment methods
5. **Settings**: Language and currency preferences
6. **Security**: Password change, 2FA, etc.

## Dependencies

- `react-hook-form` - Form state management
- `yup` - Form validation
- `@hookform/resolvers` - Yup integration
- `react-hot-toast` - Success/error notifications
- `react-icons` - UI icons
- `react-bootstrap` - UI components
