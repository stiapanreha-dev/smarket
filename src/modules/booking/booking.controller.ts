import { Controller, Get } from '@nestjs/common';
import { BookingService } from './booking.service';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('info')
  getInfo(): string {
    return this.bookingService.getModuleInfo();
  }
}
