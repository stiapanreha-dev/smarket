import { useState, useEffect, useCallback } from 'react';
import { processOfflineQueue, apiClient } from '@/api/axios.config';
import toast from 'react-hot-toast';

interface NetworkStatus {
  /**
   * Whether the browser is online
   */
  isOnline: boolean;

  /**
   * Whether the API is reachable
   */
  isApiReachable: boolean;

  /**
   * Whether currently checking API reachability
   */
  isChecking: boolean;

  /**
   * Last time the status was checked
   */
  lastChecked: Date | null;

  /**
   * Manual check function
   */
  checkStatus: () => Promise<void>;
}

/**
 * Hook for monitoring network status
 * Tracks browser online/offline state and API reachability
 *
 * @example
 * ```tsx
 * const { isOnline, isApiReachable, checkStatus } = useNetworkStatus();
 *
 * if (!isOnline) {
 *   return <OfflineBanner />;
 * }
 * ```
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isApiReachable, setIsApiReachable] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  /**
   * Check if API is reachable by making a lightweight health check
   */
  const checkApiReachability = useCallback(async () => {
    if (!navigator.onLine) {
      setIsApiReachable(false);
      return;
    }

    setIsChecking(true);

    try {
      // Try to reach the API health endpoint or any lightweight endpoint
      await apiClient.get('/health', { timeout: 5000 });
      setIsApiReachable(true);
      setLastChecked(new Date());
    } catch (error) {
      console.warn('API unreachable:', error);
      setIsApiReachable(false);
      setLastChecked(new Date());
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Handle browser going online
   */
  const handleOnline = useCallback(async () => {
    console.log('Network: Browser is online');
    setIsOnline(true);

    // Check API reachability
    await checkApiReachability();

    // Process queued offline requests
    if (isApiReachable) {
      console.log('Network: Processing offline queue');
      await processOfflineQueue(apiClient);
      toast.success('Connection restored! Syncing data...', { duration: 3000 });
    }
  }, [checkApiReachability, isApiReachable]);

  /**
   * Handle browser going offline
   */
  const handleOffline = useCallback(() => {
    console.log('Network: Browser is offline');
    setIsOnline(false);
    setIsApiReachable(false);
    toast.error('You are offline. Changes will be synced when connection is restored.', {
      duration: 5000,
      id: 'offline-toast',
    });
  }, []);

  /**
   * Manual status check
   */
  const checkStatus = useCallback(async () => {
    setIsOnline(navigator.onLine);
    if (navigator.onLine) {
      await checkApiReachability();
    } else {
      setIsApiReachable(false);
    }
  }, [checkApiReachability]);

  /**
   * Set up network status event listeners
   */
  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check API reachability on mount
    checkApiReachability();

    // Periodic check every 30 seconds if online
    const intervalId = setInterval(
      () => {
        if (navigator.onLine) {
          checkApiReachability();
        }
      },
      30000 // 30 seconds
    );

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [handleOnline, handleOffline, checkApiReachability]);

  return {
    isOnline,
    isApiReachable,
    isChecking,
    lastChecked,
    checkStatus,
  };
}

export default useNetworkStatus;
