import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentService {
  getModuleInfo(): string {
    return 'Payment Module - Handles payment processing and transactions';
  }
}
