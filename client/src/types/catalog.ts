/**
 * Catalog module TypeScript types
 * Based on backend entities: Product, ProductVariant, ProductTranslation
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Product types supported by the platform
 */
export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  SERVICE = 'SERVICE',
  COURSE = 'COURSE',
}

/**
 * Product status lifecycle
 */
export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

/**
 * Supported locales for product translations
 */
export enum TranslationLocale {
  EN = 'en',
  RU = 'ru',
  AR = 'ar',
}

/**
 * Inventory management policies
 */
export enum InventoryPolicy {
  DENY = 'deny', // Cannot sell if out of stock
  CONTINUE = 'continue', // Can sell even if out of stock
  TRACK = 'track', // Track inventory but don't enforce
}

/**
 * Variant availability status
 */
export enum VariantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}

/**
 * Sort options for product listings
 */
export type ProductSortOption =
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'popular'
  | 'rating';

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Product specifications (stored in attrs.specifications)
 */
export interface ProductSpecifications {
  volume_ml?: number;
  color?: string;
  box_included?: boolean;
  [key: string]: any;
}

/**
 * Product attributes (flexible JSONB field)
 */
export interface ProductAttributes {
  brand?: string;
  color?: string;
  size?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  category?: string[];
  tags?: string[];
  specifications?: ProductSpecifications;
  [key: string]: any;
}

/**
 * SEO metadata for product
 */
export interface ProductSEO {
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
}

/**
 * Product translation for a specific locale
 */
export interface ProductTranslation {
  id: string;
  product_id: string;
  locale: TranslationLocale;
  title: string;
  description: string | null;
  slug: string | null;
  attrs: {
    short_description?: string;
    features?: string[];
    specifications?: Record<string, string>;
    seo_title?: string;
    seo_description?: string;
    keywords?: string[];
    [key: string]: any;
  } | null;
  created_at: string;
  updated_at: string;
}

/**
 * Product variant attributes (flexible JSONB field)
 */
export interface VariantAttributes {
  size?: string;
  color?: string;
  material?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  // For services
  duration?: number; // in minutes
  capacity?: number;
  // For courses
  access_duration?: number; // in days
  [key: string]: any;
}

/**
 * Product variant (SKU with specific price, inventory, etc.)
 */
export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  title: string | null;
  price_minor: number; // Price in minor units (cents)
  price: number; // Computed: price_minor / 100
  currency: string;
  compare_at_price_minor: number | null; // Original price for discounts
  compare_at_price: number | null; // Computed
  inventory_quantity: number;
  inventory_policy: InventoryPolicy;
  status: VariantStatus;
  attrs: VariantAttributes | null;
  image_url: string | null;
  position: number | null;
  weight: number | null; // in kg
  requires_shipping: boolean;
  taxable: boolean;
  barcode: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  is_on_sale: boolean;
  discount_percentage: number | null;
  is_in_stock: boolean;
}

/**
 * Main Product entity
 */
export interface Product {
  id: string;
  merchant_id: string;
  type: ProductType;
  title: string;
  short_description?: string | null;
  description: string | null;
  slug: string | null;
  status: ProductStatus;
  base_price_minor: number | null; // Price in minor units (cents)
  base_price: number | null; // Computed: base_price_minor / 100
  currency: string;
  attrs: ProductAttributes | null;
  image_url: string | null;
  images: string[] | null;
  view_count: number;
  sales_count: number;
  rating: number | null;
  review_count: number;
  seo: ProductSEO | null;
  published_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  // Relations (optional, loaded when needed)
  variants?: ProductVariant[];
  translations?: ProductTranslation[];
  // Computed fields
  is_published: boolean;
  is_physical: boolean;
  is_service: boolean;
  is_course: boolean;
}

/**
 * Category interface (categories are stored in product attrs.category)
 * This is a simplified representation for filtering and display purposes
 */
export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parent_id?: string;
}

/**
 * Product search and filter parameters
 */
export interface ProductFilters {
  q?: string; // Search query
  type?: ProductType;
  status?: ProductStatus;
  merchant_id?: string;
  min_price?: number; // In minor units (cents)
  max_price?: number; // In minor units (cents)
  attributes?: Record<string, any>; // Filter by product attributes
  category_id?: string; // Virtual - for filtering by category
  search?: string; // Alias for 'q'
  sort_by?: ProductSortOption;
  order?: 'asc' | 'desc';
  sort?: ProductSortOption; // Alias for 'sort_by'
  locale?: TranslationLocale;
  limit?: number;
  offset?: number;
  page?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number; // total_pages
  offset?: number;
  next_cursor?: string | null;
}

/**
 * Paginated products response
 */
export interface PaginatedProducts {
  data: Product[];
  pagination: PaginationMeta;
  facets?: {
    types?: Record<string, number>;
    price_ranges?: Record<string, number>;
    merchants?: Record<string, number>;
    availability?: {
      in_stock: number;
      out_of_stock: number;
    };
  };
  performance?: {
    query_time_ms: number;
    cache_hit: boolean;
  };
}

/**
 * Single product response (with relations loaded)
 */
export interface ProductDetail extends Product {
  variants: ProductVariant[];
  translations: ProductTranslation[];
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Type guard to check if product is physical
 */
export function isPhysicalProduct(product: Product): boolean {
  return product.type === ProductType.PHYSICAL;
}

/**
 * Type guard to check if product is service
 */
export function isServiceProduct(product: Product): boolean {
  return product.type === ProductType.SERVICE;
}

/**
 * Type guard to check if product is course
 */
export function isCourseProduct(product: Product): boolean {
  return product.type === ProductType.COURSE;
}

/**
 * Get product price for display (handles base_price_minor conversion)
 */
export function getProductPrice(product: Product): number | null {
  if (product.base_price !== undefined && product.base_price !== null) {
    return product.base_price;
  }
  return product.base_price_minor ? product.base_price_minor / 100 : null;
}

/**
 * Get variant price for display (handles price_minor conversion)
 */
export function getVariantPrice(variant: ProductVariant): number {
  if (variant.price !== undefined && variant.price !== null) {
    return variant.price;
  }
  return variant.price_minor / 100;
}

/**
 * Format price with currency
 */
export function formatPrice(
  amount: number | null,
  currency: string = 'USD',
  locale: string = 'en-US',
): string {
  if (amount === null) return 'N/A';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Get product translation for specific locale with fallback
 */
export function getProductTranslation(
  product: Product,
  locale: TranslationLocale = TranslationLocale.EN,
): ProductTranslation | null {
  if (!product.translations || product.translations.length === 0) {
    return null;
  }

  // Try to find exact locale match
  const translation = product.translations.find((t) => t.locale === locale);
  if (translation) {
    return translation;
  }

  // Fallback to English
  const enTranslation = product.translations.find(
    (t) => t.locale === TranslationLocale.EN,
  );
  if (enTranslation) {
    return enTranslation;
  }

  // Return first available translation
  return product.translations[0] || null;
}

/**
 * Check if product is in stock (considers variants if available)
 */
export function isProductInStock(product: Product): boolean {
  if (product.status === ProductStatus.OUT_OF_STOCK) {
    return false;
  }

  if (!product.variants || product.variants.length === 0) {
    return product.status === ProductStatus.ACTIVE;
  }

  // Check if any variant is in stock
  // First check is_in_stock field if available, otherwise check inventory_quantity
  return product.variants.some((variant) => {
    // If is_in_stock is explicitly set, use it
    if (variant.is_in_stock !== undefined) {
      return variant.is_in_stock;
    }

    // Otherwise, calculate based on inventory_quantity and policy
    if (variant.inventory_policy === InventoryPolicy.CONTINUE) {
      return true;
    }

    return variant.inventory_quantity > 0;
  });
}
