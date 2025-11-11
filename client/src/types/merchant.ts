/**
 * Merchant Dashboard Types
 */

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface OrdersByStatusData {
  status: string;
  count: number;
}

export interface TopProductData {
  product_id: string;
  product_name: string;
  total_sold: number;
  total_revenue: number;
}

export interface RecentOrderData {
  order_id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_products: number;
  average_rating: number | null;
  revenue_chart: RevenueDataPoint[];
  orders_by_status: OrdersByStatusData[];
  top_products: TopProductData[];
  recent_orders: RecentOrderData[];
}
