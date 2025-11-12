import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * PageLoader - Full page loading component for lazy-loaded routes
 * Used as Suspense fallback for page-level code splitting
 */
export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return <LoadingSpinner fullPage variant="primary" text={text} />;
};

export default PageLoader;
