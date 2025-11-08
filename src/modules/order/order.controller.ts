import { Controller, Get } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('info')
  getInfo(): string {
    return this.orderService.getModuleInfo();
  }
}
