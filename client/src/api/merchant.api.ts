/**
 * Merchant API Client
 *
 * API client for merchant-specific operations
 */

import { apiClient } from './axios.config';
import type { Product, ProductType, ProductStatus, PaginatedProducts, InventoryPolicy } from '@/types/catalog';
import type { Order, PaginatedOrders, PhysicalItemStatus, LineItemStatus } from '@/types/order';

// ============================================================================
// Types
// ============================================================================

export interface MerchantProductFilters {
  type?: ProductType;
  status?: ProductStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateProductDto {
  // Basic Information
  title: string;
  description?: string;
  type: ProductType;
  status?: ProductStatus;
  attrs?: {
    category?: string[];
    tags?: string[];
    [key: string]: any;
  };

  // Images
  image_url?: string;
  images?: string[];

  // Pricing & Inventory
  base_price_minor?: number;
  currency?: string;
  variants?: CreateVariantDto[];

  // SEO
  seo?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  };
  slug?: string;

  // Metadata
  metadata?: Record<string, any>;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  id: string;
}

export interface CreateVariantDto {
  sku: string;
  title?: string;
  price_minor: number;
  currency: string;
  compare_at_price_minor?: number;
  inventory_quantity?: number;
  inventory_policy?: InventoryPolicy;
  attrs?: {
    // For Physical
    weight?: number;
    barcode?: string;
    cost_per_item?: number;
    // For Digital
    file_url?: string;
    file_size?: number;
    file_format?: string;
    download_limit?: number;
    // For Service
    duration?: number; // in minutes
    location?: string;
    capacity?: number;
    [key: string]: any;
  };
  image_url?: string;
  requires_shipping?: boolean;
  taxable?: boolean;
}

export interface UploadImageResponse {
  url: string;
  file_name: string;
  size: number;
}

export interface MerchantProductsResponse {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    offset: number;
  };
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * Get merchant's products with filters
 */
export const getMerchantProducts = async (
  filters: MerchantProductFilters = {}
): Promise<MerchantProductsResponse> => {
  const response = await apiClient.get<MerchantProductsResponse>('/merchant/products', {
    params: filters,
  });
  return response.data;
};

/**
 * Delete a product (soft delete)
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  await apiClient.delete(`/merchant/products/${productId}`);
};

/**
 * Toggle product status between active and inactive
 */
export const toggleProductStatus = async (productId: string): Promise<Product> => {
  const response = await apiClient.patch<Product>(`/merchant/products/${productId}/toggle-status`);
  return response.data;
};

/**
 * Get a single product by ID
 */
export const getMerchantProduct = async (productId: string): Promise<Product> => {
  const response = await apiClient.get<Product>(`/merchant/products/${productId}`);
  return response.data;
};

/**
 * Create a new product
 */
export const createProduct = async (data: CreateProductDto): Promise<Product> => {
  const response = await apiClient.post<Product>('/merchant/products', data);
  return response.data;
};

/**
 * Update an existing product
 */
export const updateProduct = async (productId: string, data: Partial<CreateProductDto>): Promise<Product> => {
  const response = await apiClient.patch<Product>(`/merchant/products/${productId}`, data);
  return response.data;
};

/**
 * Upload product image
 */
export const uploadProductImage = async (file: File): Promise<UploadImageResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadImageResponse>(
    '/merchant/products/upload-image',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};

// ============================================================================
// Orders API
// ============================================================================

export interface MerchantOrderFilters {
  status?: string; // Can be line item status
  search?: string; // Search by order number or customer
  date_from?: string; // ISO date
  date_to?: string; // ISO date
  page?: number;
  limit?: number;
}

export interface UpdateOrderStatusDto {
  status: string; // New line item status
  line_item_id?: string; // Optional: update specific line item
}

export interface AddTrackingNumberDto {
  tracking_number: string;
  carrier?: string;
  line_item_id?: string; // Optional: for specific line item
}

/**
 * Get merchant's orders with filters
 */
export const getMerchantOrders = async (
  filters: MerchantOrderFilters = {}
): Promise<PaginatedOrders> => {
  const response = await apiClient.get<PaginatedOrders>('/merchant/orders', {
    params: filters,
  });
  return response.data;
};

/**
 * Get a single order by ID
 */
export const getMerchantOrder = async (orderId: string): Promise<Order> => {
  const response = await apiClient.get<Order>(`/merchant/orders/${orderId}`);
  return response.data;
};

/**
 * Update order status (or line item status)
 */
export const updateOrderStatus = async (
  orderId: string,
  data: UpdateOrderStatusDto
): Promise<Order> => {
  const response = await apiClient.patch<Order>(
    `/merchant/orders/${orderId}/status`,
    data
  );
  return response.data;
};

/**
 * Add tracking number to order
 */
export const addTrackingNumber = async (
  orderId: string,
  data: AddTrackingNumberDto
): Promise<Order> => {
  const response = await apiClient.post<Order>(
    `/merchant/orders/${orderId}/tracking`,
    data
  );
  return response.data;
};

/**
 * Export orders to CSV
 */
export const exportOrdersToCSV = async (
  filters: MerchantOrderFilters = {}
): Promise<Blob> => {
  const response = await apiClient.get('/merchant/orders/export/csv', {
    params: filters,
    responseType: 'blob',
  });
  return response.data;
};

// ============================================================================
// Export all methods
// ============================================================================

export const merchantApi = {
  getMerchantProducts,
  getMerchantProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  uploadProductImage,
  getMerchantOrders,
  getMerchantOrder,
  updateOrderStatus,
  addTrackingNumber,
  exportOrdersToCSV,
};

export default merchantApi;
