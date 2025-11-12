import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant } from '../../database/entities/merchant.entity';
import { Order } from '../../database/entities/order.entity';
import { OrderLineItem } from '../../database/entities/order-line-item.entity';
import { Product } from '../../database/entities/product.entity';
import { MerchantDashboardController } from './controllers/merchant-dashboard.controller';
import { MerchantProductController } from './controllers/merchant-product.controller';
import { MerchantDashboardService } from './services/merchant-dashboard.service';
import { MerchantProductService } from './services/merchant-product.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant, Order, OrderLineItem, Product]),
  ],
  controllers: [MerchantDashboardController, MerchantProductController],
  providers: [MerchantDashboardService, MerchantProductService],
  exports: [MerchantDashboardService, MerchantProductService],
})
export class MerchantModule {}
