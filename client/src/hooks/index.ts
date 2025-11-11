/**
 * Custom React hooks
 *
 * This directory contains custom hooks for:
 * - Data fetching
 * - Form handling
 * - Authentication
 * - Localization
 * - etc.
 */

// Export catalog hooks
export {
  useProducts,
  useProduct,
  useProductBySlug,
  useCategories,
  useSearchProducts,
  useFeaturedProducts,
  useRelatedProducts,
  catalogKeys,
} from './useCatalog';

// Export order hooks
export {
  useOrders,
  useOrder,
  useCancelOrder,
  useRequestRefund,
  orderKeys,
} from './useOrders';

// Export hooks here
// Example:
// export { useAuth } from './useAuth';
// export { useCart } from './useCart';
// export { useLocale } from './useLocale';
