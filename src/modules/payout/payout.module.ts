import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Payout } from '../../database/entities/payout.entity';
import { PayoutBatch } from '../../database/entities/payout-batch.entity';
import { ReconciliationReport } from '../../database/entities/reconciliation-report.entity';
import { PaymentSplit } from '../../database/entities/payment-split.entity';
import { Merchant } from '../../database/entities/merchant.entity';
import { PayoutService } from './services/payout.service';
import { ReconciliationService } from './services/reconciliation.service';
import { PayoutSchedulerService } from './services/payout-scheduler.service';
import { MerchantPayoutController } from './controllers/merchant-payout.controller';
import { AdminPayoutController } from './controllers/admin-payout.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payout, PayoutBatch, ReconciliationReport, PaymentSplit, Merchant]),
    ScheduleModule.forRoot(),
    OrdersModule, // For OutboxService
  ],
  providers: [PayoutService, ReconciliationService, PayoutSchedulerService],
  controllers: [MerchantPayoutController, AdminPayoutController],
  exports: [PayoutService, ReconciliationService],
})
export class PayoutModule {}
