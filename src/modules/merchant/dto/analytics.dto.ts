import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

// Query DTO
export class AnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2025-01-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Compare with previous period', example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  compare?: boolean;
}

// Response DTOs
export class KPIValueDto {
  @ApiProperty({ description: 'Current value', example: 12500.75 })
  value: number;

  @ApiPropertyOptional({ description: 'Change percentage from previous period', example: 15.5 })
  change?: number;
}

export class KPIDataDto {
  @ApiProperty({ description: 'Revenue KPI' })
  revenue: KPIValueDto;

  @ApiProperty({ description: 'Orders count KPI' })
  orders: KPIValueDto;

  @ApiProperty({ description: 'Average order value KPI' })
  avgOrderValue: KPIValueDto;
}

export class RevenueByDayDto {
  @ApiProperty({ description: 'Date', example: '2025-01-15' })
  date: string;

  @ApiProperty({ description: 'Revenue for this day', example: 1500.5 })
  revenue: number;

  @ApiPropertyOptional({ description: 'Revenue from previous period for comparison' })
  previousRevenue?: number;
}

export class RevenueByProductTypeDto {
  @ApiProperty({ description: 'Product type', example: 'physical' })
  type: string;

  @ApiProperty({ description: 'Total revenue', example: 5000.0 })
  revenue: number;

  @ApiProperty({ description: 'Number of orders', example: 25 })
  count: number;
}

export class TopCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Electronics' })
  category: string;

  @ApiProperty({ description: 'Total revenue', example: 8500.0 })
  revenue: number;

  @ApiProperty({ description: 'Number of items sold', example: 42 })
  count: number;
}

export class OrdersByHourDto {
  @ApiProperty({ description: 'Hour of day (0-23)', example: 14 })
  hour: number;

  @ApiProperty({ description: 'Day of week (0=Sunday, 6=Saturday)', example: 1 })
  dayOfWeek: number;

  @ApiProperty({ description: 'Number of orders', example: 12 })
  count: number;
}

export class OrderDetailDto {
  @ApiProperty({ description: 'Order date', example: '2025-01-15' })
  date: string;

  @ApiProperty({ description: 'Order number', example: 'ORD-20250115-0001' })
  orderNumber: string;

  @ApiProperty({ description: 'Customer name', example: 'John Doe' })
  customer: string;

  @ApiProperty({ description: 'Order total', example: 150.5 })
  total: number;

  @ApiProperty({ description: 'Order status', example: 'DELIVERED' })
  status: string;
}

export class AnalyticsDataDto {
  @ApiProperty({ description: 'KPI metrics with optional period comparison' })
  kpi: KPIDataDto;

  @ApiProperty({ description: 'Revenue by day for chart', type: [RevenueByDayDto] })
  revenueByDay: RevenueByDayDto[];

  @ApiProperty({
    description: 'Revenue breakdown by product type',
    type: [RevenueByProductTypeDto],
  })
  revenueByProductType: RevenueByProductTypeDto[];

  @ApiProperty({ description: 'Top categories by revenue', type: [TopCategoryDto] })
  topCategories: TopCategoryDto[];

  @ApiProperty({ description: 'Orders heatmap by hour and day of week', type: [OrdersByHourDto] })
  ordersByHour: OrdersByHourDto[];

  @ApiProperty({ description: 'Order details for export', type: [OrderDetailDto] })
  ordersDetail: OrderDetailDto[];

  @ApiProperty({ description: 'Period start date' })
  periodStart: string;

  @ApiProperty({ description: 'Period end date' })
  periodEnd: string;
}
