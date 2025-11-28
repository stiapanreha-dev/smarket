import { ApiProperty } from '@nestjs/swagger';
import { Order, OrderStatus } from '@/database/entities/order.entity';

export class RecentOrderDto {
  @ApiProperty({ description: 'Order ID' })
  id: string;

  @ApiProperty({ description: 'Human-readable order number' })
  order_number: string;

  @ApiProperty({ description: 'Order status', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ description: 'Total amount in cents' })
  total_amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Order creation date' })
  created_at: Date;

  @ApiProperty({ description: 'Number of items in order' })
  items_count: number;
}

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total number of orders' })
  totalOrders: number;

  @ApiProperty({ description: 'Total amount spent in cents' })
  totalSpent: number;

  @ApiProperty({ description: 'User preferred currency code' })
  currency: string;

  @ApiProperty({ description: 'Number of active/pending orders' })
  activeOrders: number;

  @ApiProperty({ description: 'Items requiring user action' })
  pendingActions: number;

  @ApiProperty({
    description: 'Orders count by status',
    example: { pending: 2, completed: 10, cancelled: 1 },
  })
  ordersByStatus: Record<string, number>;

  @ApiProperty({
    description: 'Recent orders (last 5)',
    type: [RecentOrderDto],
  })
  recentOrders: RecentOrderDto[];
}
