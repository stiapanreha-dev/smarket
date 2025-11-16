import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../../../database/entities/merchant.entity';
import { Order } from '../../../database/entities/order.entity';
import { OrderLineItem } from '../../../database/entities/order-line-item.entity';
import { Product } from '../../../database/entities/product.entity';
import {
  DashboardStatsDto,
  RevenueDataPoint,
  OrdersByStatusData,
  TopProductData,
  RecentOrderData,
} from '../dto/dashboard-stats.dto';

@Injectable()
export class MerchantDashboardService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderLineItem)
    private readonly lineItemRepository: Repository<OrderLineItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getDashboardStats(merchantId: string): Promise<DashboardStatsDto> {
    const [
      totalRevenue,
      orderCounts,
      totalProducts,
      averageRating,
      revenueChart,
      ordersByStatus,
      topProducts,
      recentOrders,
    ] = await Promise.all([
      this.getTotalRevenue(merchantId),
      this.getOrderCounts(merchantId),
      this.getTotalProducts(merchantId),
      this.getAverageRating(merchantId),
      this.getRevenueChart(merchantId),
      this.getOrdersByStatus(merchantId),
      this.getTopProducts(merchantId),
      this.getRecentOrders(merchantId),
    ]);

    return {
      total_revenue: totalRevenue,
      total_orders: orderCounts.total,
      pending_orders: orderCounts.pending,
      completed_orders: orderCounts.completed,
      total_products: totalProducts,
      average_rating: averageRating,
      revenue_chart: revenueChart,
      orders_by_status: ordersByStatus,
      top_products: topProducts,
      recent_orders: recentOrders,
    };
  }

  private async getTotalRevenue(merchantId: string): Promise<number> {
    // Get total revenue for current month
    // Fixed: use lowercase statuses to match database enum
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.lineItemRepository
      .createQueryBuilder('li')
      .select('SUM(li.total_price)', 'total')
      .innerJoin('li.order', 'o')
      .where('li.merchant_id = :merchantId', { merchantId })
      .andWhere('o.created_at >= :startOfMonth', { startOfMonth })
      .andWhere('o.status NOT IN (:...cancelledStatuses)', {
        cancelledStatuses: ['cancelled', 'refunded'],
      })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  private async getOrderCounts(
    merchantId: string,
  ): Promise<{ total: number; pending: number; completed: number }> {
    // Get unique order IDs for this merchant
    const orderIds = await this.lineItemRepository
      .createQueryBuilder('li')
      .select('DISTINCT li.order_id', 'order_id')
      .where('li.merchant_id = :merchantId', { merchantId })
      .getRawMany();

    const orderIdList = orderIds.map((o) => o.order_id);

    if (orderIdList.length === 0) {
      return { total: 0, pending: 0, completed: 0 };
    }

    const [total, pending, completed] = await Promise.all([
      this.orderRepository.count({
        where: { id: orderIdList as any }, // TypeORM In operator
      }),
      this.orderRepository.count({
        where: {
          id: orderIdList as any,
          status: 'PENDING' as any,
        },
      }),
      this.orderRepository.count({
        where: {
          id: orderIdList as any,
          status: 'DELIVERED' as any,
        },
      }),
    ]);

    return { total, pending, completed };
  }

  private async getTotalProducts(merchantId: string): Promise<number> {
    return this.productRepository.count({
      where: { merchant_id: merchantId },
    });
  }

  private async getAverageRating(merchantId: string): Promise<number | null> {
    // TODO: Implement when rating/review system is added
    // For now, return null
    return null;
  }

  private async getRevenueChart(merchantId: string): Promise<RevenueDataPoint[]> {
    // Get revenue for last 7 days
    const days = 7;
    const result: RevenueDataPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const revenue = await this.lineItemRepository
        .createQueryBuilder('li')
        .select('SUM(li.total_price)', 'total')
        .innerJoin('li.order', 'o')
        .where('li.merchant_id = :merchantId', { merchantId })
        .andWhere('o.created_at >= :date', { date })
        .andWhere('o.created_at < :nextDate', { nextDate })
        .andWhere('o.status NOT IN (:...cancelledStatuses)', {
          cancelledStatuses: ['cancelled', 'refunded'],
        })
        .getRawOne();

      result.push({
        date: date.toISOString().split('T')[0],
        revenue: parseFloat(revenue?.total || '0'),
      });
    }

    return result;
  }

  private async getOrdersByStatus(merchantId: string): Promise<OrdersByStatusData[]> {
    // Get unique order IDs for this merchant
    const orderIds = await this.lineItemRepository
      .createQueryBuilder('li')
      .select('DISTINCT li.order_id', 'order_id')
      .where('li.merchant_id = :merchantId', { merchantId })
      .getRawMany();

    const orderIdList = orderIds.map((o) => o.order_id);

    if (orderIdList.length === 0) {
      return [];
    }

    const result = await this.orderRepository
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('o.id IN (:...orderIds)', { orderIds: orderIdList })
      .groupBy('o.status')
      .getRawMany();

    return result.map((r) => ({
      status: r.status,
      count: parseInt(r.count, 10),
    }));
  }

  private async getTopProducts(merchantId: string): Promise<TopProductData[]> {
    const result = await this.lineItemRepository
      .createQueryBuilder('li')
      .select('li.product_id', 'product_id')
      .addSelect('p.title', 'product_name')
      .addSelect('SUM(li.quantity)', 'total_sold')
      .addSelect('SUM(li.total_price)', 'total_revenue')
      .innerJoin('li.product', 'p')
      .innerJoin('li.order', 'o')
      .where('li.merchant_id = :merchantId', { merchantId })
      .andWhere('o.status NOT IN (:...cancelledStatuses)', {
        cancelledStatuses: ['cancelled', 'refunded'],
      })
      .groupBy('li.product_id')
      .addGroupBy('p.title')
      .orderBy('total_revenue', 'DESC')
      .limit(5)
      .getRawMany();

    return result.map((r) => ({
      product_id: r.product_id,
      product_name: r.product_name,
      total_sold: parseInt(r.total_sold, 10),
      total_revenue: parseFloat(r.total_revenue),
    }));
  }

  private async getRecentOrders(merchantId: string): Promise<RecentOrderData[]> {
    const result = await this.lineItemRepository
      .createQueryBuilder('li')
      .select('o.id', 'order_id')
      .addSelect('o.order_number', 'order_number')
      .addSelect('o.total_amount', 'total')
      .addSelect('o.status', 'status')
      .addSelect('o.created_at', 'created_at')
      .addSelect('u.first_name', 'first_name')
      .addSelect('u.last_name', 'last_name')
      .innerJoin('li.order', 'o')
      .leftJoin('o.user', 'u')
      .where('li.merchant_id = :merchantId', { merchantId })
      .groupBy('o.id')
      .addGroupBy('o.order_number')
      .addGroupBy('o.total_amount')
      .addGroupBy('o.status')
      .addGroupBy('o.created_at')
      .addGroupBy('u.first_name')
      .addGroupBy('u.last_name')
      .orderBy('o.created_at', 'DESC')
      .limit(10)
      .getRawMany();

    return result.map((r) => ({
      order_id: r.order_id,
      order_number: r.order_number,
      customer_name: `${r.first_name} ${r.last_name}`,
      total: parseFloat(r.total),
      status: r.status,
      created_at: r.created_at,
    }));
  }
}
