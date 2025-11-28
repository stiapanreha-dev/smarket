import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { CheckoutModule } from '../checkout/checkout.module';

@Module({
  imports: [CheckoutModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
