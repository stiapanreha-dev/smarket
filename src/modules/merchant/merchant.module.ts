import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant } from '../../database/entities/merchant.entity';
import { MerchantApplication } from '../../database/entities/merchant-application.entity';
import { User } from '../../database/entities/user.entity';
import { Order } from '../../database/entities/order.entity';
import { OrderLineItem } from '../../database/entities/order-line-item.entity';
import { Product } from '../../database/entities/product.entity';
import { ProductTranslation } from '../../database/entities/product-translation.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { MerchantDashboardController } from './controllers/merchant-dashboard.controller';
import { MerchantProductController } from './controllers/merchant-product.controller';
import { MerchantApplicationController } from './controllers/merchant-application.controller';
import { AdminMerchantApplicationController } from './controllers/admin-merchant-application.controller';
import { MerchantDashboardService } from './services/merchant-dashboard.service';
import { MerchantAnalyticsService } from './services/merchant-analytics.service';
import { MerchantProductService } from './services/merchant-product.service';
import { MerchantApplicationService } from './services/merchant-application.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Merchant,
      MerchantApplication,
      User,
      Order,
      OrderLineItem,
      Product,
      ProductTranslation,
      ProductVariant,
    ]),
  ],
  controllers: [
    MerchantDashboardController,
    MerchantProductController,
    MerchantApplicationController,
    AdminMerchantApplicationController,
  ],
  providers: [
    MerchantDashboardService,
    MerchantAnalyticsService,
    MerchantProductService,
    MerchantApplicationService,
  ],
  exports: [
    MerchantDashboardService,
    MerchantAnalyticsService,
    MerchantProductService,
    MerchantApplicationService,
  ],
})
export class MerchantModule {}
