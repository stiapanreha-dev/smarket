import { Injectable } from '@nestjs/common';

@Injectable()
export class BookingService {
  getModuleInfo(): string {
    return 'Booking Module - Manages product reservations and bookings';
  }
}
