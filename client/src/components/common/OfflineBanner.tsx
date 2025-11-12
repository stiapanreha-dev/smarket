import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface OfflineBannerProps {
  /**
   * Position of the banner
   * @default 'top'
   */
  position?: 'top' | 'bottom';

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Offline banner component
 * Shows a banner when the user is offline or API is unreachable
 */
export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  position = 'top',
  className = '',
}) => {
  const { isOnline, isApiReachable, isChecking, checkStatus } = useNetworkStatus();

  // Don't show banner if everything is working
  if (isOnline && isApiReachable) {
    return null;
  }

  const positionStyles: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    right: 0,
    zIndex: 9999,
    margin: 0,
    borderRadius: 0,
    ...(position === 'top' ? { top: 0 } : { bottom: 0 }),
  };

  return (
    <Alert
      variant={!isOnline ? 'danger' : 'warning'}
      className={`d-flex align-items-center justify-content-between ${className}`}
      style={positionStyles}
    >
      <div className="d-flex align-items-center">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="me-2"
        >
          {!isOnline ? (
            // Wifi off icon
            <>
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </>
          ) : (
            // Alert circle icon
            <>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </>
          )}
        </svg>
        <span className="fw-semibold">
          {!isOnline
            ? 'You are offline'
            : 'Server connection lost'}
        </span>
        <span className="ms-2 opacity-75">
          {!isOnline
            ? 'Check your internet connection'
            : 'Unable to reach the server'}
        </span>
      </div>
      <Button
        variant={!isOnline ? 'outline-light' : 'outline-dark'}
        size="sm"
        onClick={checkStatus}
        disabled={isChecking}
      >
        {isChecking ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            />
            Checking...
          </>
        ) : (
          'Retry'
        )}
      </Button>
    </Alert>
  );
};

export default OfflineBanner;
