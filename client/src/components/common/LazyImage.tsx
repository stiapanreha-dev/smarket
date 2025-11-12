import React, { useState } from 'react';
import { generateBlurPlaceholder } from '@/utils/lazyImage';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Placeholder color while loading */
  placeholderColor?: string;
  /** Additional className */
  className?: string;
  /** Aspect ratio for placeholder (e.g., '16/9', '1/1') */
  aspectRatio?: string;
}

/**
 * LazyImage - Optimized image component with lazy loading and blur placeholder
 *
 * Features:
 * - Native lazy loading with loading="lazy"
 * - Blur placeholder while image loads
 * - Smooth fade-in transition
 * - Error handling with fallback
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholderColor = '#e0e0e0',
  className = '',
  aspectRatio,
  style,
  ...rest
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
  };

  const handleError = () => {
    setError(true);
    setLoaded(true); // Show fallback
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: placeholderColor,
    ...(aspectRatio && { aspectRatio }),
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease-in-out',
    opacity: loaded ? 1 : 0,
    ...style,
  };

  const placeholderStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `url(${generateBlurPlaceholder(placeholderColor)})`,
    backgroundSize: 'cover',
    opacity: loaded ? 0 : 1,
    transition: 'opacity 0.3s ease-in-out',
  };

  return (
    <div className={className} style={containerStyle}>
      {/* Blur placeholder */}
      <div style={placeholderStyle} aria-hidden="true" />

      {/* Actual image */}
      {!error ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          style={imageStyle}
          {...rest}
        />
      ) : (
        /* Error fallback */
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            color: '#6c757d',
          }}
        >
          <span>Image not available</span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
