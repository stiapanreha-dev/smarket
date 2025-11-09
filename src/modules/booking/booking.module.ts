import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service, Schedule, Booking, OrderLineItem, Merchant, User } from '@database/entities';
import { CacheService } from '@common/services/cache.service';

// Services
import {
  ServiceService,
  ScheduleService,
  BookingService,
  SlotAvailabilityService,
  ReminderService,
} from './services';

// Controllers
import { BookingController, ServiceController, ProviderBookingController } from './controllers';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Schedule, Booking, OrderLineItem, Merchant, User])],
  controllers: [BookingController, ServiceController, ProviderBookingController],
  providers: [
    ServiceService,
    ScheduleService,
    BookingService,
    SlotAvailabilityService,
    ReminderService,
    CacheService,
  ],
  exports: [ServiceService, ScheduleService, BookingService, SlotAvailabilityService],
})
export class BookingModule {}
