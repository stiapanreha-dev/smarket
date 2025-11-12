/**
 * Performance optimization hooks
 * Includes useDebounce, useThrottle, and other performance-related hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for debounced value
 * Updates the value only after the specified delay has passed without changes
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 *
 * @example
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 300);
 *
 * useEffect(() => {
 *   // This will only run 300ms after the user stops typing
 *   fetchSearchResults(debouncedQuery);
 * }, [debouncedQuery]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for debounced callback
 * Returns a memoized callback that will only be called after the specified delay
 *
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @param deps - Dependencies array
 * @returns Debounced callback
 *
 * @example
 * const handleSearch = useDebounceCallback((query: string) => {
 *   fetchSearchResults(query);
 * }, 300, []);
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay, ...deps]
  );
}

/**
 * Hook for throttled callback
 * Returns a memoized callback that will only be called once per specified time period
 *
 * @param callback - Function to throttle
 * @param limit - Time limit in milliseconds (default: 100ms)
 * @param deps - Dependencies array
 * @returns Throttled callback
 *
 * @example
 * const handleScroll = useThrottleCallback(() => {
 *   console.log('Scroll position:', window.scrollY);
 * }, 100, []);
 */
export function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 100,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  const inThrottleRef = useRef<boolean>(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottleRef.current) {
        callback(...args);
        inThrottleRef.current = true;

        setTimeout(() => {
          inThrottleRef.current = false;
        }, limit);
      }
    },
    [callback, limit, ...deps]
  );
}

/**
 * Hook for window resize with throttling
 * Returns the current window dimensions, throttled to avoid excessive updates
 *
 * @param throttleMs - Throttle time in milliseconds (default: 200ms)
 * @returns Object with width and height
 *
 * @example
 * const { width, height } = useWindowResize(200);
 */
export function useWindowResize(throttleMs: number = 200) {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    let inThrottle = false;

    const handleResize = () => {
      if (!inThrottle) {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });

        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, throttleMs);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [throttleMs]);

  return dimensions;
}

/**
 * Hook for scroll position with throttling
 * Returns the current scroll position, throttled to avoid excessive updates
 *
 * @param throttleMs - Throttle time in milliseconds (default: 100ms)
 * @returns Object with scrollX and scrollY
 *
 * @example
 * const { scrollY } = useScrollPosition(100);
 */
export function useScrollPosition(throttleMs: number = 100) {
  const [position, setPosition] = useState({
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  });

  useEffect(() => {
    let inThrottle = false;

    const handleScroll = () => {
      if (!inThrottle) {
        setPosition({
          scrollX: window.scrollX,
          scrollY: window.scrollY,
        });

        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, throttleMs);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [throttleMs]);

  return position;
}
