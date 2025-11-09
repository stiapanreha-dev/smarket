import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Payment } from '../../database/entities/payment.entity';
import { PaymentSplit } from '../../database/entities/payment-split.entity';
import { Refund } from '../../database/entities/refund.entity';
import { WebhookEvent } from '../../database/entities/webhook-event.entity';
import { Order } from '../../database/entities/order.entity';
import { Merchant } from '../../database/entities/merchant.entity';
import { OrderOutbox } from '../../database/entities/order-outbox.entity';
import { OrderOutboxDLQ } from '../../database/entities/order-outbox-dlq.entity';

// Controllers
import { PaymentController } from './controllers/payment.controller';
import { WebhookController } from './controllers/webhook.controller';

// Services
import { PaymentService } from './services/payment.service';
import { WebhookService } from './services/webhook.service';
import { SplitCalculationService } from './services/split-calculation.service';

// Providers
import { StripeProvider } from './providers/stripe.provider';
import { YooKassaProvider } from './providers/yookassa.provider';
import { NetworkIntlProvider } from './providers/network-intl.provider';

// Import OutboxService from orders module
import { OutboxService } from '../orders/services/outbox.service';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';

// Handlers
import { PaymentEventHandler } from './handlers/payment-event.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      PaymentSplit,
      Refund,
      WebhookEvent,
      Order,
      Merchant,
      OrderOutbox,
      OrderOutboxDLQ,
    ]),
    ConfigModule,
    EventEmitterModule,
  ],
  controllers: [PaymentController, WebhookController],
  providers: [
    // Core services
    PaymentService,
    WebhookService,
    SplitCalculationService,
    OutboxService,

    // Payment providers
    StripeProvider,
    YooKassaProvider,
    NetworkIntlProvider,

    // Event handlers
    PaymentEventHandler,
  ],
  exports: [
    PaymentService,
    WebhookService,
    SplitCalculationService,
  ],
})
export class PaymentModule {}
