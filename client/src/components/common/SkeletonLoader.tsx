import React from 'react';
import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  /** Width of the skeleton element */
  width?: string | number;
  /** Height of the skeleton element */
  height?: string | number;
  /** Border radius */
  borderRadius?: string | number;
  /** Number of skeleton lines to render */
  count?: number;
  /** CSS class name */
  className?: string;
  /** Shape of skeleton */
  variant?: 'text' | 'rect' | 'circle';
}

/**
 * SkeletonLoader - Placeholder component for content loading
 * Used as Suspense fallback for component-level code splitting
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  count = 1,
  className = '',
  variant = 'text',
}) => {
  const getStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width,
      height,
      borderRadius: variant === 'circle' ? '50%' : borderRadius,
    };

    if (variant === 'text') {
      return { ...baseStyle, marginBottom: '8px' };
    }

    return baseStyle;
  };

  const skeletons = Array.from({ length: count }, (_, index) => (
    <div key={index} className={`skeleton-loader ${className}`} style={getStyle()} />
  ));

  return <>{skeletons}</>;
};

/**
 * ProductCardSkeleton - Skeleton for ProductCard component
 */
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="card h-100">
      <SkeletonLoader height="200px" borderRadius="0.25rem 0.25rem 0 0" />
      <div className="card-body">
        <SkeletonLoader height="24px" width="70%" />
        <SkeletonLoader height="16px" width="50%" count={2} />
        <div className="mt-3">
          <SkeletonLoader height="40px" borderRadius="0.25rem" />
        </div>
      </div>
    </div>
  );
};

/**
 * OrderCardSkeleton - Skeleton for Order list items
 */
export const OrderCardSkeleton: React.FC = () => {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <SkeletonLoader height="20px" width="150px" />
          <SkeletonLoader height="24px" width="80px" borderRadius="12px" />
        </div>
        <SkeletonLoader height="16px" width="40%" />
        <SkeletonLoader height="16px" width="30%" />
      </div>
    </div>
  );
};

export default SkeletonLoader;
