# Error Handling & Monitoring Guide

This guide covers the comprehensive error handling and monitoring infrastructure implemented in the SnailMarketplace frontend.

## Table of Contents

1. [Overview](#overview)
2. [Error Boundary](#error-boundary)
3. [useErrorHandler Hook](#useerrorhandler-hook)
4. [Form Validation Errors](#form-validation-errors)
5. [Toast Notifications](#toast-notifications)
6. [Network Status Monitoring](#network-status-monitoring)
7. [Performance Monitoring](#performance-monitoring)
8. [Sentry Integration](#sentry-integration)
9. [Best Practices](#best-practices)

---

## Overview

The error handling system provides:

- ✅ **Global Error Boundary** - Catches React component errors
- ✅ **Centralized Error Handler Hook** - Consistent error handling across the app
- ✅ **Automatic Retry Logic** - Exponential backoff for failed requests (3 retries)
- ✅ **Offline Detection** - Queue requests when offline, retry when back online
- ✅ **Form Validation** - Field-level and summary error displays
- ✅ **Toast Notifications** - User-friendly feedback (success/error/warning/info)
- ✅ **Network Status Banner** - Shows when offline or API is unreachable
- ✅ **Performance Monitoring** - Tracks Core Web Vitals (FCP, LCP, FID, CLS)
- ✅ **Sentry Integration** - Error tracking and logging (ready for production)

---

## Error Boundary

### Global Error Boundary

The global error boundary is already configured in `App.tsx` and catches all unhandled React errors.

```tsx
// App.tsx - Already configured
<ErrorBoundary level="global">
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  </HelmetProvider>
</ErrorBoundary>
```

### Page-Level Error Boundary

Wrap individual pages or sections with error boundaries for granular error handling:

```tsx
import { ErrorBoundary } from '@/components/common';

const MyPage = () => {
  return (
    <ErrorBoundary level="page">
      <YourPageContent />
    </ErrorBoundary>
  );
};
```

### Component-Level Error Boundary

Wrap components that might fail without breaking the entire page:

```tsx
import { ErrorBoundary } from '@/components/common';

const MyComponent = () => {
  return (
    <ErrorBoundary level="component">
      <SomeRiskyComponent />
    </ErrorBoundary>
  );
};
```

### Custom Error Boundary Fallback

```tsx
import { ErrorBoundary } from '@/components/common';

const CustomFallback = () => (
  <div>
    <h2>Something went wrong</h2>
    <button onClick={() => window.location.reload()}>Reload</button>
  </div>
);

<ErrorBoundary fallback={<CustomFallback />}>
  <YourComponent />
</ErrorBoundary>
```

---

## useErrorHandler Hook

Centralized error handling hook for consistent error management.

### Basic Usage

```tsx
import { useErrorHandler } from '@/hooks';

const MyComponent = () => {
  const { handleError, handleApiError } = useErrorHandler();

  const fetchData = async () => {
    try {
      const data = await api.getData();
      return data;
    } catch (error) {
      handleApiError(error, {
        toastMessage: 'Failed to load data',
        logToSentry: true,
      });
    }
  };

  return <div>{/* Your component */}</div>;
};
```

### API Error Handling

```tsx
import { useErrorHandler } from '@/hooks';

const MyComponent = () => {
  const { handleApiError } = useErrorHandler();

  const updateProfile = async (data) => {
    try {
      await api.updateProfile(data);
      toast.success('Profile updated successfully!');
    } catch (error) {
      handleApiError(error, {
        toastMessage: 'Failed to update profile',
        redirectToLoginOn401: true, // Redirect to login if unauthorized
        logToSentry: true,
      });
    }
  };
};
```

### Custom Error Messages

```tsx
const { handleError } = useErrorHandler();

try {
  // Some operation
} catch (error) {
  handleError(error, {
    toastMessage: 'Custom error message',
    toastDuration: 5000,
    showToast: true,
    logToConsole: true,
    logToSentry: true,
  });
}
```

### Error with Redirect

```tsx
const { handleApiError } = useErrorHandler();

try {
  await api.deleteAccount();
} catch (error) {
  handleApiError(error, {
    toastMessage: 'Failed to delete account',
    redirectTo: '/profile', // Redirect to profile page
  });
}
```

---

## Form Validation Errors

### Field-Level Errors

Display errors below individual form inputs:

```tsx
import { FieldError } from '@/components/common';
import { useForm } from 'react-hook-form';

const MyForm = () => {
  const { register, formState: { errors } } = useForm();

  return (
    <div>
      <input {...register('email')} />
      <FieldError message={errors.email?.message} />

      <input {...register('password')} />
      <FieldError message={errors.password?.message} />
    </div>
  );
};
```

### Form Error Summary

Display all errors at the top of a form:

```tsx
import { FormErrorSummary, scrollToError } from '@/components/common';
import { useForm } from 'react-hook-form';

const MyForm = () => {
  const { handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormErrorSummary
        errors={errors}
        show={Object.keys(errors).length > 0}
        title="Please fix the following errors:"
        onErrorClick={(field) => scrollToError(field)}
      />

      {/* Form fields */}
    </form>
  );
};
```

### useFormErrors Hook

Simplified form error management:

```tsx
import { useFormErrors } from '@/components/common';

const MyForm = () => {
  const {
    errors,
    hasErrors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    setMultipleErrors,
  } = useFormErrors();

  const handleSubmit = async (data) => {
    try {
      clearAllErrors();
      await api.submitForm(data);
    } catch (error) {
      // Set multiple errors from API response
      setMultipleErrors({
        email: 'Email already exists',
        password: 'Password too weak',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      {errors.email && <FieldError message={errors.email} />}

      <input name="password" />
      {errors.password && <FieldError message={errors.password} />}
    </form>
  );
};
```

---

## Toast Notifications

Enhanced toast notifications with consistent styling.

### Basic Toast Notifications

```tsx
import { toastUtils } from '@/utils';

// Success toast (3 seconds, green)
toastUtils.success('Profile updated successfully!');

// Error toast (5 seconds, red, manual dismiss)
toastUtils.error('Failed to load data');

// Warning toast (4 seconds, orange)
toastUtils.warning('Your session is about to expire');

// Info toast (4 seconds, blue)
toastUtils.info('New messages available');

// Loading toast (doesn't auto-dismiss)
const loadingToastId = toastUtils.loading('Uploading file...');
```

### Promise-Based Toast

Automatically handles loading → success/error transitions:

```tsx
import { toastUtils } from '@/utils';

const uploadFile = async (file) => {
  return toastUtils.promise(
    api.uploadFile(file),
    {
      loading: 'Uploading file...',
      success: 'File uploaded successfully!',
      error: 'Failed to upload file',
    }
  );
};
```

### Toast with Action Button

```tsx
import { toastUtils } from '@/utils';

toastUtils.withAction(
  'Item removed from cart',
  'Undo',
  () => {
    // Restore item
    cart.addItem(item);
  }
);
```

### Confirmation Toast

```tsx
import { toastUtils } from '@/utils';

toastUtils.confirm(
  'Are you sure you want to delete this item?',
  () => {
    // User clicked Yes
    deleteItem(id);
  },
  () => {
    // User clicked No
    console.log('Cancelled');
  }
);
```

### Unique Toast (Prevent Duplicates)

```tsx
import { toastUtils } from '@/utils';

// Only shows one toast per message within 2 seconds
toastUtils.unique('Data saved', 'success');
```

---

## Network Status Monitoring

### Offline Banner

The offline banner is already configured in `App.tsx` and automatically shows when:

- Browser is offline (`navigator.onLine === false`)
- API is unreachable (server down or network error)

```tsx
// App.tsx - Already configured
<OfflineBanner />
```

### useNetworkStatus Hook

Monitor network status in your components:

```tsx
import { useNetworkStatus } from '@/hooks';

const MyComponent = () => {
  const { isOnline, isApiReachable, isChecking, checkStatus } = useNetworkStatus();

  if (!isOnline) {
    return <div>You are offline</div>;
  }

  if (!isApiReachable) {
    return (
      <div>
        Server unreachable
        <button onClick={checkStatus} disabled={isChecking}>
          Retry
        </button>
      </div>
    );
  }

  return <div>Connected</div>;
};
```

### Automatic Retry When Back Online

The axios interceptor automatically:

1. Detects when browser goes offline
2. Queues failed requests
3. Retries queued requests when connection is restored

**No additional code needed** - it works automatically!

---

## Performance Monitoring

### Automatic Core Web Vitals Tracking

Performance monitoring is already initialized in `App.tsx` and automatically tracks:

- **FCP** (First Contentful Paint)
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)

```tsx
// App.tsx - Already initialized
useEffect(() => {
  initPerformanceMonitoring();
}, []);
```

### Custom Performance Metrics

```tsx
import { measureCustomMetric, startMeasure, endMeasure } from '@/utils';

// Measure custom metric
measureCustomMetric('api_call_duration', 234, {
  endpoint: '/api/products',
  method: 'GET',
});

// Measure code execution time
startMeasure('expensive-operation');
// ... do expensive operation
const duration = endMeasure('expensive-operation'); // Returns duration in ms
```

### Measure Async Function

```tsx
import { measureAsync } from '@/utils';

const loadData = async () => {
  return measureAsync('load-data', async () => {
    const data = await api.getData();
    return data;
  });
};
```

---

## Sentry Integration

### Setup Sentry (Production)

1. **Install Sentry:**

```bash
npm install @sentry/react
```

2. **Set environment variable:**

```bash
# .env
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

3. **Uncomment Sentry code:**

Open `client/src/utils/sentry.ts` and uncomment the import and `Sentry.init()` code.

4. **Sentry is automatically initialized** in `App.tsx`

### Manual Error Logging

```tsx
import { captureException, captureMessage, addBreadcrumb } from '@/utils';

// Capture exception
try {
  riskyOperation();
} catch (error) {
  captureException(error, {
    userId: user.id,
    action: 'risky-operation',
  });
}

// Capture message (non-error events)
captureMessage('User performed action', 'info', {
  userId: user.id,
  action: 'button-click',
});

// Add breadcrumb for debugging
addBreadcrumb('User clicked button', 'ui', 'info', {
  buttonId: 'submit-btn',
});
```

### Set User Context

```tsx
import { setUser, clearUser } from '@/utils';

// After login
setUser({
  id: user.id,
  email: user.email,
  username: user.username,
});

// On logout
clearUser();
```

---

## Best Practices

### 1. **Use Error Boundaries for Critical Sections**

Wrap important sections with error boundaries to prevent full app crashes:

```tsx
<ErrorBoundary level="page">
  <CheckoutPage />
</ErrorBoundary>
```

### 2. **Use useErrorHandler for API Calls**

Always use `handleApiError` for consistent error handling:

```tsx
const { handleApiError } = useErrorHandler();

try {
  await api.updateData(data);
} catch (error) {
  handleApiError(error, {
    toastMessage: 'Failed to update data',
    logToSentry: true,
  });
}
```

### 3. **Show Loading States**

Always show loading indicators during async operations:

```tsx
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await api.submitForm(data);
    toastUtils.success('Form submitted!');
  } catch (error) {
    handleApiError(error);
  } finally {
    setIsLoading(false);
  }
};
```

### 4. **Validate Forms Before Submission**

Use react-hook-form with yup validation to catch errors early:

```tsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object().shape({
  email: yup.string().required().email(),
  password: yup.string().required().min(6),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: yupResolver(schema),
});
```

### 5. **Handle Offline State Gracefully**

Use the network status hook to handle offline scenarios:

```tsx
const { isOnline } = useNetworkStatus();

const handleSubmit = async () => {
  if (!isOnline) {
    toastUtils.error('You are offline. Please check your connection.');
    return;
  }

  // Proceed with submission
};
```

### 6. **Log Important Actions**

Add breadcrumbs for debugging complex user flows:

```tsx
import { addBreadcrumb } from '@/utils';

const handleCheckout = () => {
  addBreadcrumb('User started checkout', 'navigation', 'info', {
    cartItems: cart.items.length,
    totalAmount: cart.total,
  });

  // Proceed with checkout
};
```

### 7. **Monitor Performance**

Track custom metrics for critical operations:

```tsx
import { measureCustomMetric } from '@/utils';

const loadProducts = async () => {
  const startTime = Date.now();

  const products = await api.getProducts();

  const duration = Date.now() - startTime;
  measureCustomMetric('products_load_time', duration, {
    count: products.length,
  });

  return products;
};
```

---

## Summary

The comprehensive error handling and monitoring system provides:

✅ **Automatic error catching** with Error Boundaries
✅ **Centralized error handling** with useErrorHandler hook
✅ **Automatic retries** with exponential backoff (3 retries)
✅ **Offline detection** and request queuing
✅ **User-friendly error messages** with toast notifications
✅ **Form validation** with field-level and summary errors
✅ **Network status monitoring** with offline banner
✅ **Performance tracking** for Core Web Vitals
✅ **Error logging** with Sentry integration (ready for production)

All features are **already configured** in `App.tsx` and ready to use throughout the application!

---

## Additional Resources

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [React Hot Toast](https://react-hot-toast.com/)
- [Web Vitals](https://web.dev/vitals/)
- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
