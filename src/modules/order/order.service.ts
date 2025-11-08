import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderService {
  getModuleInfo(): string {
    return 'Order Module - Manages customer orders and order processing';
  }
}
