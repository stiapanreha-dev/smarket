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

/**
 * Analytics Types
 */

export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  compare?: boolean;
}

export interface KPIValue {
  value: number;
  change?: number;
}

export interface KPIData {
  revenue: KPIValue;
  orders: KPIValue;
  avgOrderValue: KPIValue;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
  previousRevenue?: number;
}

export interface RevenueByProductType {
  type: string;
  revenue: number;
  count: number;
}

export interface TopCategory {
  category: string;
  revenue: number;
  count: number;
}

export interface OrdersByHour {
  hour: number;
  dayOfWeek: number;
  count: number;
}

export interface OrderDetail {
  date: string;
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
}

export interface AnalyticsData {
  kpi: KPIData;
  revenueByDay: RevenueByDay[];
  revenueByProductType: RevenueByProductType[];
  topCategories: TopCategory[];
  ordersByHour: OrdersByHour[];
  ordersDetail: OrderDetail[];
  periodStart: string;
  periodEnd: string;
}
