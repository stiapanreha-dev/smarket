/**
 * Image Optimization Utilities
 *
 * Helper functions for optimizing images:
 * - Generate WebP URLs
 * - Generate responsive srcset
 * - Image compression hints
 */

/**
 * Generate WebP URL from original image URL
 * Assumes your CDN/backend supports WebP conversion
 *
 * @param originalUrl - Original image URL
 * @returns WebP URL
 *
 * @example
 * const webpUrl = getWebPUrl('https://cdn.example.com/image.jpg');
 * // Returns: https://cdn.example.com/image.webp
 */
export function getWebPUrl(originalUrl: string): string {
  if (!originalUrl) return '';

  // If URL already has format parameter, replace it
  if (originalUrl.includes('format=')) {
    return originalUrl.replace(/format=\w+/, 'format=webp');
  }

  // If URL has query parameters, add format parameter
  if (originalUrl.includes('?')) {
    return `${originalUrl}&format=webp`;
  }

  // Replace extension with .webp
  return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
}

/**
 * Generate srcset for responsive images
 * Creates multiple sizes for different screen densities
 *
 * @param baseUrl - Base image URL
 * @param widths - Array of widths to generate
 * @returns Srcset string
 *
 * @example
 * const srcset = generateSrcSet('https://cdn.example.com/image.jpg', [400, 800, 1200]);
 * // Returns: "https://cdn.example.com/image.jpg?w=400 400w, ..."
 */
export function generateSrcSet(baseUrl: string, widths: number[] = [400, 800, 1200, 1600]): string {
  if (!baseUrl) return '';

  return widths
    .map((width) => {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}w=${width} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 * Based on common Bootstrap breakpoints
 *
 * @param columns - Grid columns at different breakpoints
 * @returns Sizes string
 *
 * @example
 * const sizes = generateSizes({ xs: 12, sm: 6, lg: 4, xl: 3 });
 * // Returns: "(max-width: 576px) 100vw, (max-width: 768px) 50vw, ..."
 */
export function generateSizes(columns: {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}): string {
  const breakpoints = [
    { name: 'xs', maxWidth: 576, cols: columns.xs || 12 },
    { name: 'sm', maxWidth: 768, cols: columns.sm || columns.xs || 12 },
    { name: 'md', maxWidth: 992, cols: columns.md || columns.sm || columns.xs || 12 },
    { name: 'lg', maxWidth: 1200, cols: columns.lg || columns.md || columns.sm || columns.xs || 12 },
    { name: 'xl', maxWidth: Infinity, cols: columns.xl || columns.lg || columns.md || columns.sm || columns.xs || 12 },
  ];

  const sizes = breakpoints
    .map((bp, index) => {
      const vw = (bp.cols / 12) * 100;

      if (index === breakpoints.length - 1) {
        // Last breakpoint (xl) doesn't need max-width
        return `${vw}vw`;
      }

      return `(max-width: ${bp.maxWidth}px) ${vw}vw`;
    })
    .join(', ');

  return sizes;
}

/**
 * Get optimized image props for LazyImage component
 * Automatically generates WebP, srcset, and sizes
 *
 * @param imageUrl - Original image URL
 * @param options - Optimization options
 * @returns Props for LazyImage component
 *
 * @example
 * const imageProps = getOptimizedImageProps('https://cdn.example.com/image.jpg', {
 *   widths: [400, 800, 1200],
 *   columns: { xs: 12, sm: 6, lg: 4 },
 * });
 *
 * <LazyImage src={imageUrl} {...imageProps} alt="Product" />
 */
export function getOptimizedImageProps(
  imageUrl: string,
  options: {
    widths?: number[];
    columns?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
    enableWebP?: boolean;
  } = {}
): {
  webpSrc?: string;
  srcSet?: string;
  sizes?: string;
} {
  const { widths = [400, 800, 1200, 1600], columns, enableWebP = true } = options;

  const props: {
    webpSrc?: string;
    srcSet?: string;
    sizes?: string;
  } = {};

  if (enableWebP) {
    props.webpSrc = getWebPUrl(imageUrl);
  }

  if (widths.length > 0) {
    props.srcSet = generateSrcSet(imageUrl, widths);
  }

  if (columns) {
    props.sizes = generateSizes(columns);
  }

  return props;
}

/**
 * Check if browser supports WebP
 * Uses a small WebP image to test support
 *
 * @returns Promise that resolves to true if WebP is supported
 *
 * @example
 * const supportsWebP = await checkWebPSupport();
 * if (supportsWebP) {
 *   // Use WebP images
 * }
 */
export async function checkWebPSupport(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}
