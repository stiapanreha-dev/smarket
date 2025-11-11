// TypeScript types for SnailMarketplace

export interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
  features: string[];
}

export type Language = 'en' | 'ru' | 'ar';

export interface NavLink {
  label: string;
  href: string;
}

// Export API types
export * from './api';

// Export Catalog types
export * from './catalog';

// Export Cart types
export * from './cart';

// Export Checkout types
export * from './checkout';

// Export Order types
export * from './order';

// Export Address types
export * from './address';
