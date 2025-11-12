import toast, { Toast, ToastOptions } from 'react-hot-toast';

/**
 * Enhanced toast notification utilities
 * Provides consistent toast notifications across the application
 */

// Default toast options
const DEFAULT_OPTIONS: ToastOptions = {
  position: 'top-right',
  duration: 3000,
};

const SUCCESS_OPTIONS: ToastOptions = {
  ...DEFAULT_OPTIONS,
  duration: 3000,
  icon: '✅',
  style: {
    background: '#10b981',
    color: '#fff',
  },
};

const ERROR_OPTIONS: ToastOptions = {
  ...DEFAULT_OPTIONS,
  duration: 5000,
  icon: '❌',
  style: {
    background: '#ef4444',
    color: '#fff',
  },
};

const WARNING_OPTIONS: ToastOptions = {
  ...DEFAULT_OPTIONS,
  duration: 4000,
  icon: '⚠️',
  style: {
    background: '#f59e0b',
    color: '#fff',
  },
};

const INFO_OPTIONS: ToastOptions = {
  ...DEFAULT_OPTIONS,
  duration: 4000,
  icon: 'ℹ️',
  style: {
    background: '#3b82f6',
    color: '#fff',
  },
};

const LOADING_OPTIONS: ToastOptions = {
  ...DEFAULT_OPTIONS,
  duration: Infinity, // Loading toasts don't auto-dismiss
  icon: '⏳',
};

/**
 * Show success toast
 */
export const showSuccess = (message: string, options?: ToastOptions): string => {
  return toast.success(message, {
    ...SUCCESS_OPTIONS,
    ...options,
  });
};

/**
 * Show error toast
 */
export const showError = (message: string, options?: ToastOptions): string => {
  return toast.error(message, {
    ...ERROR_OPTIONS,
    ...options,
  });
};

/**
 * Show warning toast
 */
export const showWarning = (message: string, options?: ToastOptions): string => {
  return toast(message, {
    ...WARNING_OPTIONS,
    ...options,
  });
};

/**
 * Show info toast
 */
export const showInfo = (message: string, options?: ToastOptions): string => {
  return toast(message, {
    ...INFO_OPTIONS,
    ...options,
  });
};

/**
 * Show loading toast (returns toast ID for later dismissal)
 */
export const showLoading = (message: string, options?: ToastOptions): string => {
  return toast.loading(message, {
    ...LOADING_OPTIONS,
    ...options,
  });
};

/**
 * Update an existing toast (useful for loading -> success/error transitions)
 */
export const updateToast = (
  toastId: string,
  message: string,
  type: 'success' | 'error' | 'loading' | 'blank',
  options?: ToastOptions
): void => {
  const typeOptions = {
    success: SUCCESS_OPTIONS,
    error: ERROR_OPTIONS,
    loading: LOADING_OPTIONS,
    blank: DEFAULT_OPTIONS,
  };

  toast[type](message, {
    id: toastId,
    ...typeOptions[type],
    ...options,
  });
};

/**
 * Dismiss a specific toast
 */
export const dismissToast = (toastId: string): void => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = (): void => {
  toast.dismiss();
};

/**
 * Promise-based toast (automatically handles loading -> success/error)
 */
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  },
  options?: ToastOptions
): Promise<T> => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      ...DEFAULT_OPTIONS,
      ...options,
    }
  );
};

/**
 * Show custom toast with action button
 */
export const showWithAction = (
  message: string,
  actionLabel: string,
  onAction: () => void,
  options?: ToastOptions
): string => {
  return toast(
    (t: Toast) => (
      <div className="d-flex align-items-center justify-content-between gap-3">
        <span>{message}</span>
        <button
          className="btn btn-sm btn-light"
          onClick={() => {
            onAction();
            toast.dismiss(t.id);
          }}
        >
          {actionLabel}
        </button>
      </div>
    ),
    {
      ...DEFAULT_OPTIONS,
      duration: 5000,
      ...options,
    }
  );
};

/**
 * Show confirmation toast with Yes/No buttons
 */
export const showConfirm = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  options?: ToastOptions
): string => {
  return toast(
    (t: Toast) => (
      <div>
        <div className="mb-2">{message}</div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              onConfirm();
              toast.dismiss(t.id);
            }}
          >
            Yes
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => {
              onCancel?.();
              toast.dismiss(t.id);
            }}
          >
            No
          </button>
        </div>
      </div>
    ),
    {
      ...DEFAULT_OPTIONS,
      duration: Infinity, // Don't auto-dismiss
      ...options,
    }
  );
};

/**
 * Batch toast operations (prevent duplicate toasts)
 */
const recentToasts = new Map<string, number>();
const DUPLICATE_THRESHOLD = 2000; // 2 seconds

export const showUnique = (
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  options?: ToastOptions
): string | null => {
  const key = `${type}:${message}`;
  const lastShown = recentToasts.get(key);
  const now = Date.now();

  // Prevent duplicate toasts within threshold
  if (lastShown && now - lastShown < DUPLICATE_THRESHOLD) {
    return null;
  }

  recentToasts.set(key, now);

  // Clean up old entries
  setTimeout(() => recentToasts.delete(key), DUPLICATE_THRESHOLD);

  const showFn = {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
  }[type];

  return showFn(message, options);
};

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  promise: showPromise,
  update: updateToast,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
  withAction: showWithAction,
  confirm: showConfirm,
  unique: showUnique,
};
