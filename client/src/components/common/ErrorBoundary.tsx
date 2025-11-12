import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, Button, Container } from 'react-bootstrap';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'global' | 'page' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches JavaScript errors in child components
 * Displays fallback UI and logs errors for monitoring
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Store error info in state
    this.setState({ errorInfo });

    // Call optional error callback (for logging to Sentry, etc.)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to Sentry if available
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        level: 'error',
        tags: {
          errorBoundary: this.props.level || 'unknown',
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI based on level
      const { level = 'component', children } = this.props;
      const { error, errorInfo } = this.state;

      if (level === 'global') {
        return (
          <Container className="d-flex align-items-center justify-content-center min-vh-100">
            <div className="text-center" style={{ maxWidth: '600px' }}>
              <div className="mb-4">
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-danger mx-auto"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h1 className="h2 mb-3">Oops! Something went wrong</h1>
              <p className="text-muted mb-4">
                We're sorry, but something unexpected happened. Our team has been notified and
                we're working on fixing it.
              </p>
              {import.meta.env.DEV && error && (
                <Alert variant="danger" className="text-start mb-4">
                  <Alert.Heading className="h6">Error Details (Dev Only)</Alert.Heading>
                  <pre className="mb-0" style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                    {error.toString()}
                    {errorInfo && errorInfo.componentStack}
                  </pre>
                </Alert>
              )}
              <div className="d-flex gap-2 justify-content-center">
                <Button variant="primary" onClick={this.handleReload}>
                  Reload Page
                </Button>
                <Button variant="outline-secondary" onClick={this.handleReset}>
                  Try Again
                </Button>
              </div>
            </div>
          </Container>
        );
      }

      if (level === 'page') {
        return (
          <Container className="py-5">
            <Alert variant="danger">
              <Alert.Heading>Unable to load this page</Alert.Heading>
              <p>
                Something went wrong while loading this page. Please try again or return to the
                home page.
              </p>
              {import.meta.env.DEV && error && (
                <details className="mt-3">
                  <summary className="cursor-pointer">Error Details (Dev Only)</summary>
                  <pre className="mt-2 mb-0" style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                    {error.toString()}
                    {errorInfo && errorInfo.componentStack}
                  </pre>
                </details>
              )}
              <hr />
              <div className="d-flex gap-2">
                <Button variant="danger" size="sm" onClick={this.handleReset}>
                  Try Again
                </Button>
                <Button variant="outline-secondary" size="sm" href="/">
                  Go Home
                </Button>
              </div>
            </Alert>
          </Container>
        );
      }

      // Component level - minimal fallback
      return (
        <Alert variant="warning" className="my-2">
          <div className="d-flex align-items-center justify-content-between">
            <span>Failed to load this component</span>
            <Button variant="link" size="sm" onClick={this.handleReset} className="p-0">
              Retry
            </Button>
          </div>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Type declaration for Sentry on window
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => void;
    };
  }
}

export default ErrorBoundary;
