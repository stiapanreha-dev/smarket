/**
 * Lazy Image Loading Utilities
 *
 * Provides utilities for lazy loading images with blur placeholder
 */

/**
 * Generate a blur placeholder data URL
 * Creates a tiny blurred version for placeholder
 */
export const generateBlurPlaceholder = (color = '#e0e0e0'): string => {
  // Create a simple 10x10 SVG blur placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
      <filter id="blur">
        <feGaussianBlur stdDeviation="2" />
      </filter>
      <rect width="10" height="10" fill="${color}" filter="url(#blur)" />
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Get optimized image attributes for lazy loading
 * @param src - Image source URL
 * @param alt - Alt text for accessibility
 * @returns Object with image props including loading and placeholder
 */
export const getLazyImageProps = (
  src: string,
  alt: string,
  placeholderColor?: string
) => {
  return {
    src,
    alt,
    loading: 'lazy' as const,
    decoding: 'async' as const,
    style: {
      backgroundColor: placeholderColor || '#f0f0f0',
    },
  };
};

/**
 * Preload critical images (e.g., above-the-fold content)
 * @param urls - Array of image URLs to preload
 */
export const preloadImages = (urls: string[]): void => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      urls.forEach((url) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
      });
    });
  }
};

/**
 * React hook for lazy image loading with blur effect
 * @param src - Image source URL
 * @returns Object with image props and loading state
 */
export const useLazyImage = (src: string) => {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const img = new Image();
    img.src = src;

    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { loaded, error };
};

// Note: Import React for the hook
import React from 'react';
