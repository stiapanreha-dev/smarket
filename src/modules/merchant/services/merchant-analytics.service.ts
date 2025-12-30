import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '../../../database/entities/order.entity';
import { OrderLineItem } from '../../../database/entities/order-line-item.entity';
import { Product } from '../../../database/entities/product.entity';
import {
  AnalyticsQueryDto,
  AnalyticsDataDto,
  KPIDataDto,
  RevenueByDayDto,
  RevenueByProductTypeDto,
  TopCategoryDto,
  OrdersByHourDto,
  OrderDetailDto,
} from '../dto/analytics.dto';

@Injectable()
export class MerchantAnalyticsService {
  private readonly logger = new Logger(MerchantAnalyticsService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderLineItem)
    private readonly lineItemRepository: Repository<OrderLineItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getAnalytics(merchantId: string, query: AnalyticsQueryDto): Promise<AnalyticsDataDto> {
    // Parse dates or use defaults (last 7 days)
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousEndDate = new Date(startDate.getTime() - 1);
    previousEndDate.setHours(23, 59, 59, 999);
    const previousStartDate = new Date(previousEndDate.getTime() - periodLength);
    previousStartDate.setHours(0, 0, 0, 0);

    const [kpi, revenueByDay, revenueByProductType, topCategories, ordersByHour, ordersDetail] =
      await Promise.all([
        this.getKPIData(
          merchantId,
          startDate,
          endDate,
          query.compare ? previousStartDate : undefined,
          query.compare ? previousEndDate : undefined,
        ),
        this.getRevenueByDay(
          merchantId,
          startDate,
          endDate,
          query.compare ? previousStartDate : undefined,
          query.compare ? previousEndDate : undefined,
        ),
        this.getRevenueByProductType(merchantId, startDate, endDate),
        this.getTopCategories(merchantId, startDate, endDate),
        this.getOrdersByHour(merchantId, startDate, endDate),
        this.getOrdersDetail(merchantId, startDate, endDate),
      ]);

    return {
      kpi,
      revenueByDay,
      revenueByProductType,
      topCategories,
      ordersByHour,
      ordersDetail,
      periodStart: startDate.toISOString().split('T')[0],
      periodEnd: endDate.toISOString().split('T')[0],
    };
  }

  private async getKPIData(
    merchantId: string,
    startDate: Date,
    endDate: Date,
    previousStartDate?: Date,
    previousEndDate?: Date,
  ): Promise<KPIDataDto> {
    // Current period stats
    const currentStats = await this.getPeriodStats(merchantId, startDate, endDate);

    // Previous period stats for comparison
    let previousStats: { revenue: number; orders: number } | null = null;
    if (previousStartDate && previousEndDate) {
      previousStats = await this.getPeriodStats(merchantId, previousStartDate, previousEndDate);
    }

    const currentAOV = currentStats.orders > 0 ? currentStats.revenue / currentStats.orders : 0;
    const previousAOV =
      previousStats && previousStats.orders > 0 ? previousStats.revenue / previousStats.orders : 0;

    return {
      revenue: {
        value: currentStats.revenue,
        change:
          previousStats && previousStats.revenue > 0
            ? ((currentStats.revenue - previousStats.revenue) / previousStats.revenue) * 100
            : undefined,
      },
      orders: {
        value: currentStats.orders,
        change:
          previousStats && previousStats.orders > 0
            ? ((currentStats.orders - previousStats.orders) / previousStats.orders) * 100
            : undefined,
      },
      avgOrderValue: {
        value: currentAOV,
        change:
          previousStats && previousAOV > 0
            ? ((currentAOV - previousAOV) / previousAOV) * 100
            : undefined,
      },
    };
  }

  private async getPeriodStats(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ revenue: number; orders: number }> {
    const result = await this.lineItemRepository
      .createQueryBuilder('li')
      .select('SUM(li.total_price)', 'revenue')
      .addSelect('COUNT(DISTINCT li.order_id)', 'orders')
      .innerJoin('li.order', 'o')
      .where('li.merchant_id = :merchantId', { merchantId })
      .andWhere('o.created_at >= :startDate', { startDate })
      .andWhere('o.created_at <= :endDate', { endDate })
      .andWhere('o.status NOT IN (:...cancelledStatuses)', {
        cancelledStatuses: ['cancelled', 'refunded'],
      })
      .getRawOne();

    return {
      revenue: parseFloat(result?.revenue || '0'),
      orders: parseInt(result?.orders || '0', 10),
    };
  }

  private async getRevenueByDay(
    merchantId: string,
    startDate: Date,
    endDate: Date,
    previousStartDate?: Date,
    previousEndDate?: Date,
  ): Promise<RevenueByDayDto[]> {
    const result: RevenueByDayDto[] = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      currentDate.setHours(0, 0, 0, 0);

      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      // Current period revenue
      const revenueResult = await this.lineItemRepository
        .createQueryBuilder('li')
        .select('SUM(li.total_price)', 'total')
        .innerJoin('li.order', 'o')
        .where('li.merchant_id = :merchantId', { merchantId })
        .andWhere('o.created_at >= :currentDate', { currentDate })
        .andWhere('o.created_at < :nextDate', { nextDate })
        .andWhere('o.status NOT IN (:...cancelledStatuses)', {
          cancelledStatuses: ['cancelled', 'refunded'],
        })
        .getRawOne();

      const dayData: RevenueByDayDto = {
        date: currentDate.toISOString().split('T')[0],
        revenue: parseFloat(revenueResult?.total || '0'),
      };

      // Previous period revenue for comparison
      if (previousStartDate && previousEndDate) {
        const previousDate = new Date(previousStartDate);
        previousDate.setDate(previousStartDate.getDate() + i);
        previousDate.setHours(0, 0, 0, 0);

        const previousNextDate = new Date(previousDate);
        previousNextDate.setDate(previousNextDate.getDate() + 1);

        const previousRevenueResult = await this.lineItemRepository
          .createQueryBuilder('li')
          .select('SUM(li.total_price)', 'total')
          .innerJoin('li.order', 'o')
          .where('li.merchant_id = :merchantId', { merchantId })
          .andWhere('o.created_at >= :previousDate', { previousDate })
          .andWhere('o.created_at < :previousNextDate', { previousNextDate })
          .andWhere('o.status NOT IN (:...cancelledStatuses)', {
            cancelledStatuses: ['cancelled', 'refunded'],
          })
          .getRawOne();

        dayData.previousRevenue = parseFloat(previousRevenueResult?.total || '0');
      }

      result.push(dayData);
    }

    return result;
  }

  private async getRevenueByProductType(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueByProductTypeDto[]> {
    const result = await this.lineItemRepository
      .createQueryBuilder('li')
      .select('p.type', 'type')
      .addSelect('SUM(li.total_price)', 'revenue')
      .addSelect('COUNT(DISTINCT li.order_id)', 'count')
      .innerJoin('li.product', 'p')
      .innerJoin('li.order', 'o')
      .where('li.merchant_id = :merchantId', { merchantId })
      .andWhere('o.created_at >= :startDate', { startDate })
      .andWhere('o.created_at <= :endDate', { endDate })
      .andWhere('o.status NOT IN (:...cancelledStatuses)', {
        cancelledStatuses: ['cancelled', 'refunded'],
      })
      .groupBy('p.type')
      .getRawMany();

    return result.map((r) => ({
      type: r.type || 'UNKNOWN',
      revenue: parseFloat(r.revenue || '0'),
      count: parseInt(r.count || '0', 10),
    }));
  }

  private async getTopCategories(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TopCategoryDto[]> {
    // Get products with their categories (stored in attrs->category JSONB)
    const result = await this.lineItemRepository
      .createQueryBuilder('li')
      .select("p.attrs->'category'", 'category')
      .addSelect('SUM(li.total_price)', 'revenue')
      .addSelect('SUM(li.quantity)', 'count')
      .innerJoin('li.product', 'p')
      .innerJoin('li.order', 'o')
      .where('li.merchant_id = :merchantId', { merchantId })
      .andWhere('o.created_at >= :startDate', { startDate })
      .andWhere('o.created_at <= :endDate', { endDate })
      .andWhere('o.status NOT IN (:...cancelledStatuses)', {
        cancelledStatuses: ['cancelled', 'refunded'],
      })
      .andWhere("p.attrs->'category' IS NOT NULL")
      .groupBy("p.attrs->'category'")
      .orderBy('revenue', 'DESC')
      .limit(10)
      .getRawMany();

    // Flatten categories array and aggregate
    const categoryMap = new Map<string, { revenue: number; count: number }>();

    for (const r of result) {
      // category can be an array in JSON
      let categories: string[] = [];
      if (Array.isArray(r.category)) {
        categories = r.category;
      } else if (typeof r.category === 'string') {
        try {
          categories = JSON.parse(r.category);
        } catch {
          categories = [r.category];
        }
      }

      const revenue = parseFloat(r.revenue || '0');
      const count = parseInt(r.count || '0', 10);

      for (const cat of categories) {
        const existing = categoryMap.get(cat) || { revenue: 0, count: 0 };
        categoryMap.set(cat, {
          revenue: existing.revenue + revenue,
          count: existing.count + count,
        });
      }
    }

    // Convert to array and sort by revenue
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        revenue: data.revenue,
        count: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  private async getOrdersByHour(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<OrdersByHourDto[]> {
    const result = await this.lineItemRepository
      .createQueryBuilder('li')
      .select('EXTRACT(HOUR FROM o.created_at)', 'hour')
      .addSelect('EXTRACT(DOW FROM o.created_at)', 'dayOfWeek')
      .addSelect('COUNT(DISTINCT li.order_id)', 'count')
      .innerJoin('li.order', 'o')
      .where('li.merchant_id = :merchantId', { merchantId })
      .andWhere('o.created_at >= :startDate', { startDate })
      .andWhere('o.created_at <= :endDate', { endDate })
      .andWhere('o.status NOT IN (:...cancelledStatuses)', {
        cancelledStatuses: ['cancelled', 'refunded'],
      })
      .groupBy('EXTRACT(HOUR FROM o.created_at)')
      .addGroupBy('EXTRACT(DOW FROM o.created_at)')
      .getRawMany();

    return result.map((r) => ({
      hour: parseInt(r.hour, 10),
      dayOfWeek: parseInt(r.dayOfWeek, 10),
      count: parseInt(r.count, 10),
    }));
  }

  private async getOrdersDetail(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<OrderDetailDto[]> {
    const result = await this.lineItemRepository
      .createQueryBuilder('li')
      .select('DATE(o.created_at)', 'date')
      .addSelect('o.order_number', 'orderNumber')
      .addSelect('o.total_amount', 'total')
      .addSelect('o.status', 'status')
      .addSelect("COALESCE(u.first_name || ' ' || u.last_name, 'Guest')", 'customer')
      .innerJoin('li.order', 'o')
      .leftJoin('o.user', 'u')
      .where('li.merchant_id = :merchantId', { merchantId })
      .andWhere('o.created_at >= :startDate', { startDate })
      .andWhere('o.created_at <= :endDate', { endDate })
      .groupBy('o.id')
      .addGroupBy('o.order_number')
      .addGroupBy('o.total_amount')
      .addGroupBy('o.status')
      .addGroupBy('o.created_at')
      .addGroupBy('u.first_name')
      .addGroupBy('u.last_name')
      .orderBy('o.created_at', 'DESC')
      .getRawMany();

    return result.map((r) => ({
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date),
      orderNumber: r.orderNumber,
      customer: r.customer || 'Guest',
      total: parseFloat(r.total || '0'),
      status: r.status,
    }));
  }
}
