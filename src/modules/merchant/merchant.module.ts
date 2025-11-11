import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant } from '../../database/entities/merchant.entity';
import { Order } from '../../database/entities/order.entity';
import { OrderLineItem } from '../../database/entities/order-line-item.entity';
import { Product } from '../../database/entities/product.entity';
import { MerchantDashboardController } from './controllers/merchant-dashboard.controller';
import { MerchantDashboardService } from './services/merchant-dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant, Order, OrderLineItem, Product]),
  ],
  controllers: [MerchantDashboardController],
  providers: [MerchantDashboardService],
  exports: [MerchantDashboardService],
})
export class MerchantModule {}
