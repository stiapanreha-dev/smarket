/**
 * Sentry Integration for Error Monitoring
 *
 * To use Sentry in production:
 * 1. Install: npm install @sentry/react
 * 2. Set VITE_SENTRY_DSN in .env
 * 3. Uncomment the import and initialization code below
 */

// import * as Sentry from '@sentry/react';
// import { BrowserTracing } from '@sentry/tracing';

export interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
}

/**
 * Initialize Sentry for error tracking
 */
export const initSentry = (config?: Partial<SentryConfig>): void => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE || 'development';
  const enabled = config?.enabled ?? import.meta.env.PROD;

  // Skip initialization in development or if disabled
  if (!enabled || !sentryDsn) {
    console.log('Sentry: Disabled (development mode or no DSN configured)');
    return;
  }

  // Uncomment when @sentry/react is installed:
  /*
  Sentry.init({
    dsn: sentryDsn,
    environment,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: config?.tracesSampleRate ?? 0.1, // 10% of transactions
    // Session Replay
    replaysSessionSampleRate: config?.replaysSessionSampleRate ?? 0.1, // 10% of sessions
    replaysOnErrorSampleRate: config?.replaysOnErrorSampleRate ?? 1.0, // 100% of errors
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }
      return event;
    },
  });

  console.log('Sentry: Initialized for environment:', environment);
  */

  console.log('Sentry: Integration ready (install @sentry/react to enable)');
};

/**
 * Capture exception manually
 */
export const captureException = (
  error: Error,
  context?: Record<string, any>
): void => {
  if (window.Sentry) {
    window.Sentry.captureException(error, {
      contexts: context ? { custom: context } : undefined,
    });
  } else {
    console.error('Sentry not available:', error, context);
  }
};

/**
 * Capture a message (for non-error events)
 */
export const captureMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
): void => {
  if (window.Sentry) {
    // Uncomment when @sentry/react is installed:
    // Sentry.captureMessage(message, {
    //   level,
    //   contexts: context ? { custom: context } : undefined,
    // });
    console.log(`Sentry message [${level}]:`, message, context);
  } else {
    console.log(`[${level}]`, message, context);
  }
};

/**
 * Set user context for error tracking
 */
export const setUser = (user: {
  id: string;
  email?: string;
  username?: string;
}): void => {
  if (window.Sentry) {
    // Uncomment when @sentry/react is installed:
    // Sentry.setUser(user);
    console.log('Sentry: User set:', user);
  }
};

/**
 * Clear user context (on logout)
 */
export const clearUser = (): void => {
  if (window.Sentry) {
    // Uncomment when @sentry/react is installed:
    // Sentry.setUser(null);
    console.log('Sentry: User cleared');
  }
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
): void => {
  if (window.Sentry) {
    // Uncomment when @sentry/react is installed:
    // Sentry.addBreadcrumb({
    //   message,
    //   category,
    //   level,
    //   data,
    // });
    console.log(`Sentry breadcrumb [${category}]:`, message, data);
  }
};

/**
 * Set custom context for error tracking
 */
export const setContext = (name: string, context: Record<string, any>): void => {
  if (window.Sentry) {
    // Uncomment when @sentry/react is installed:
    // Sentry.setContext(name, context);
    console.log(`Sentry context [${name}]:`, context);
  }
};

// Type declaration for Sentry on window
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => void;
    };
  }
}

export default {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  setContext,
};
