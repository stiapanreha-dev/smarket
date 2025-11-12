/**
 * Route Prefetching Utilities
 *
 * Prefetches lazy-loaded route components on hover/mouseenter
 * to improve perceived performance
 */

// Cache for prefetched modules to prevent duplicate fetches
const prefetchCache = new Set<string>();

/**
 * Prefetch a lazy-loaded component
 * @param importFn - The dynamic import function (e.g., () => import('./Page'))
 * @param routeName - Unique identifier for the route (for caching)
 */
export const prefetchRoute = (
  importFn: () => Promise<any>,
  routeName: string
): void => {
  // Skip if already prefetched
  if (prefetchCache.has(routeName)) {
    return;
  }

  // Mark as prefetched
  prefetchCache.add(routeName);

  // Prefetch on requestIdleCallback for better performance
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFn().catch((error) => {
        console.error(`Failed to prefetch route: ${routeName}`, error);
        // Remove from cache on error to allow retry
        prefetchCache.delete(routeName);
      });
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      importFn().catch((error) => {
        console.error(`Failed to prefetch route: ${routeName}`, error);
        prefetchCache.delete(routeName);
      });
    }, 1);
  }
};

/**
 * Create prefetch handler for use with onMouseEnter/onFocus events
 * @param importFn - The dynamic import function
 * @param routeName - Unique identifier for the route
 * @returns Event handler function
 */
export const createPrefetchHandler = (
  importFn: () => Promise<any>,
  routeName: string
) => {
  return () => prefetchRoute(importFn, routeName);
};

/**
 * Preload multiple routes at once
 * Useful for prefetching critical routes after initial page load
 */
export const preloadRoutes = (
  routes: Array<{ importFn: () => Promise<any>; routeName: string }>
): void => {
  // Use requestIdleCallback to avoid blocking main thread
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      routes.forEach(({ importFn, routeName }) => {
        prefetchRoute(importFn, routeName);
      });
    });
  } else {
    setTimeout(() => {
      routes.forEach(({ importFn, routeName }) => {
        prefetchRoute(importFn, routeName);
      });
    }, 100);
  }
};
