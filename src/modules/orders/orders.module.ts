import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../database/entities/order.entity';
import { OrderLineItem } from '../../database/entities/order-line-item.entity';
import { OrderStatusTransition } from '../../database/entities/order-status-transition.entity';
import { OrderOutbox } from '../../database/entities/order-outbox.entity';
import { CheckoutSession } from '../../database/entities/checkout-session.entity';
import { Merchant } from '../../database/entities/merchant.entity';
import { OrderService } from './services/order.service';
import { OrderFSMService } from './services/order-fsm.service';
import { OutboxService } from './services/outbox.service';
import { OrderController } from './controllers/order.controller';
import { MerchantOrderController } from './controllers/merchant-order.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderLineItem,
      OrderStatusTransition,
      OrderOutbox,
      CheckoutSession,
      Merchant,
    ]),
  ],
  controllers: [OrderController, MerchantOrderController],
  providers: [OrderService, OrderFSMService, OutboxService],
  exports: [OrderService, OrderFSMService, OutboxService],
})
export class OrdersModule {}
