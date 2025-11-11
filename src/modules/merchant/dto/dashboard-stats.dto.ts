import { ApiProperty } from '@nestjs/swagger';

export class RevenueDataPoint {
  @ApiProperty({ example: '2025-11-11' })
  date: string;

  @ApiProperty({ example: 1500.5 })
  revenue: number;
}

export class OrdersByStatusData {
  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: 5 })
  count: number;
}

export class TopProductData {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  product_id: string;

  @ApiProperty({ example: 'Awesome Product' })
  product_name: string;

  @ApiProperty({ example: 25 })
  total_sold: number;

  @ApiProperty({ example: 2500.75 })
  total_revenue: number;
}

export class RecentOrderData {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  order_id: string;

  @ApiProperty({ example: 'ORD-20251111-0001' })
  order_number: string;

  @ApiProperty({ example: 'John Doe' })
  customer_name: string;

  @ApiProperty({ example: 150.5 })
  total: number;

  @ApiProperty({ example: 'PAYMENT_CONFIRMED' })
  status: string;

  @ApiProperty({ example: '2025-11-11T10:30:00Z' })
  created_at: string;
}

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total revenue for current month', example: 12500.75 })
  total_revenue: number;

  @ApiProperty({ description: 'Total orders count', example: 45 })
  total_orders: number;

  @ApiProperty({ description: 'Pending orders count', example: 5 })
  pending_orders: number;

  @ApiProperty({ description: 'Completed orders count', example: 35 })
  completed_orders: number;

  @ApiProperty({ description: 'Total products count', example: 20 })
  total_products: number;

  @ApiProperty({ description: 'Average rating', example: 4.5, nullable: true })
  average_rating: number | null;

  @ApiProperty({ description: 'Revenue data for last 7 days', type: [RevenueDataPoint] })
  revenue_chart: RevenueDataPoint[];

  @ApiProperty({ description: 'Orders grouped by status', type: [OrdersByStatusData] })
  orders_by_status: OrdersByStatusData[];

  @ApiProperty({ description: 'Top 5 selling products', type: [TopProductData] })
  top_products: TopProductData[];

  @ApiProperty({ description: 'Last 10 recent orders', type: [RecentOrderData] })
  recent_orders: RecentOrderData[];
}
