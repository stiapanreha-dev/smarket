import { Controller, Get } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('info')
  getInfo(): string {
    return this.paymentService.getModuleInfo();
  }
}
