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

// Export merchant dashboard hooks
export {
  useDashboardStats,
  merchantDashboardKeys,
} from './useMerchantDashboard';

// Export merchant product hooks
export {
  useMerchantProducts,
  useProduct as useMerchantProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useToggleProductStatus,
  useUploadProductImage,
  merchantProductKeys,
} from './useMerchantProducts';

// Export merchant order hooks
export {
  useMerchantOrders,
  useMerchantOrder,
  useUpdateOrderStatus,
  useAddTrackingNumber,
  useExportOrdersCSV,
  merchantOrderKeys,
} from './useMerchantOrders';

// Export hooks here
// Example:
// export { useAuth } from './useAuth';
// export { useCart } from './useCart';
// export { useLocale } from './useLocale';
