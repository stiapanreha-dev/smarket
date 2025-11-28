import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { TotalsCalculationService } from './services/totals-calculation.service';
import { InventoryReservationService } from './services/inventory-reservation.service';
import { StripePaymentService } from './services/stripe-payment.service';
import { CheckoutSession } from '../../database/entities/checkout-session.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { CartModule } from '../cart/cart.module';
import { OrdersModule } from '../orders/orders.module';
import { CacheService } from '../../common/services/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CheckoutSession, ProductVariant]),
    ScheduleModule.forRoot(), // Enable cron jobs for cleanup
    CartModule, // Import CartModule to use CartService
    OrdersModule, // Import OrdersModule to use OrderService
  ],
  controllers: [CheckoutController],
  providers: [
    CheckoutService,
    TotalsCalculationService,
    InventoryReservationService,
    StripePaymentService,
    CacheService,
  ],
  exports: [CheckoutService, StripePaymentService],
})
export class CheckoutModule {}
