import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Order } from '../../database/entities/order.entity';
import { OrderLineItem } from '../../database/entities/order-line-item.entity';
import { OrderStatusTransition } from '../../database/entities/order-status-transition.entity';
import { OrderOutbox } from '../../database/entities/order-outbox.entity';
import { OrderOutboxDLQ } from '../../database/entities/order-outbox-dlq.entity';
import { CheckoutSession } from '../../database/entities/checkout-session.entity';
import { Merchant } from '../../database/entities/merchant.entity';
import { OrderService } from './services/order.service';
import { OrderFSMService } from './services/order-fsm.service';
import { OutboxService } from './services/outbox.service';
import { OutboxProcessorService } from './services/outbox-processor.service';
import { OrderController } from './controllers/order.controller';
import { MerchantOrderController } from './controllers/merchant-order.controller';
import { OutboxMetricsController } from './controllers/outbox-metrics.controller';
import { OrderCreatedHandler } from './handlers/order-created.handler';
import { PaymentProcessedHandler } from './handlers/payment-processed.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderLineItem,
      OrderStatusTransition,
      OrderOutbox,
      OrderOutboxDLQ,
      CheckoutSession,
      Merchant,
    ]),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
  ],
  controllers: [OrderController, MerchantOrderController, OutboxMetricsController],
  providers: [
    OrderService,
    OrderFSMService,
    OutboxService,
    OutboxProcessorService,
    OrderCreatedHandler,
    PaymentProcessedHandler,
  ],
  exports: [OrderService, OrderFSMService, OutboxService, OutboxProcessorService],
})
export class OrdersModule {}
