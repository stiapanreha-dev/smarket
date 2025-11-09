import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Service, Schedule, Booking, BookingStatus } from '@database/entities';
import { TimeSlot, AvailableSlot } from '../interfaces/time-slot.interface';
import {
  startOfDay,
  endOfDay,
  format,
  parseISO,
  isSameDay,
  addMinutes,
  parse,
  isWithinInterval,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

@Injectable()
export class SlotAvailabilityService {
  private readonly logger = new Logger(SlotAvailabilityService.name);

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /**
   * Get available time slots for a service on a specific date
   */
  async getAvailableSlots(
    serviceId: string,
    date: Date,
    providerId?: string,
  ): Promise<AvailableSlot[]> {
    this.logger.log(
      `Getting available slots for service ${serviceId} on ${format(date, 'yyyy-MM-dd')}`,
    );

    // 1. Load service
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });

    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }

    if (service.status !== 'active') {
      this.logger.warn(`Service ${serviceId} is not active`);
      return [];
    }

    // 2. Load schedule
    const schedule = await this.scheduleRepository.findOne({
      where: {
        service_id: serviceId,
        ...(providerId && { provider_id: providerId }),
      },
    });

    if (!schedule) {
      this.logger.warn(`No schedule found for service ${serviceId}`);
      return [];
    }

    // 3. Get weekly slots for this day
    const dayOfWeek = format(date, 'EEEE').toLowerCase() as keyof typeof schedule.weekly_slots;
    let daySlots = schedule.weekly_slots[dayOfWeek] || [];

    // 4. Check for exceptions (holidays, special schedules)
    const dateStr = format(date, 'yyyy-MM-dd');
    const exception = schedule.exceptions?.find((ex) => ex.date === dateStr);

    if (exception) {
      if (exception.type === 'holiday') {
        this.logger.log(`Date ${dateStr} is marked as holiday`);
        return [];
      }
      if (exception.slots) {
        this.logger.log(`Using exception slots for date ${dateStr}`);
        daySlots = exception.slots;
      }
    }

    if (daySlots.length === 0) {
      this.logger.log(`No slots configured for ${dayOfWeek}`);
      return [];
    }

    // 5. Generate all possible time slots
    const possibleSlots = this.generateTimeSlots(
      date,
      daySlots,
      service.duration_minutes,
      service.buffer_minutes,
      schedule.timezone,
    );

    // 6. Filter out already booked slots
    const bookedSlots = await this.getBookedSlots(serviceId, date, providerId);

    const availableSlots = possibleSlots.filter((slot) => !this.hasConflict(slot, bookedSlots));

    this.logger.log(
      `Found ${availableSlots.length} available slots out of ${possibleSlots.length} possible slots`,
    );

    return availableSlots;
  }

  /**
   * Generate all possible time slots for a day
   */
  private generateTimeSlots(
    date: Date,
    daySlots: Array<{ start: string; end: string }>,
    durationMinutes: number,
    bufferMinutes: number,
    timezone: string,
  ): AvailableSlot[] {
    const slots: AvailableSlot[] = [];
    const totalDuration = durationMinutes + bufferMinutes;

    for (const period of daySlots) {
      // Parse time strings (e.g., "09:00", "18:00")
      const periodStart = parse(period.start, 'HH:mm', date);
      const periodEnd = parse(period.end, 'HH:mm', date);

      let currentTime = periodStart;

      while (currentTime < periodEnd) {
        const slotEnd = addMinutes(currentTime, durationMinutes);

        // Only add slot if it fits completely within the period
        if (slotEnd <= periodEnd) {
          slots.push({
            start: new Date(currentTime),
            end: new Date(slotEnd),
          });
        }

        // Move to next slot (including buffer time)
        currentTime = addMinutes(currentTime, totalDuration);
      }
    }

    return slots;
  }

  /**
   * Get all booked slots for a service on a specific date
   */
  private async getBookedSlots(
    serviceId: string,
    date: Date,
    providerId?: string,
  ): Promise<TimeSlot[]> {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const bookings = await this.bookingRepository.find({
      where: {
        service_id: serviceId,
        ...(providerId && { provider_id: providerId }),
        status: Between(
          [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
          [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
        ) as any,
        start_at: Between(dayStart, dayEnd) as any,
      },
      select: ['start_at', 'end_at'],
    });

    return bookings.map((b) => ({
      start: b.start_at,
      end: b.end_at,
    }));
  }

  /**
   * Check if a slot conflicts with any booked slots
   */
  private hasConflict(slot: TimeSlot, bookedSlots: TimeSlot[]): boolean {
    return bookedSlots.some((booked) => this.slotsOverlap(slot, booked));
  }

  /**
   * Check if two time slots overlap
   */
  private slotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    return (
      (slot1.start < slot2.end && slot1.end > slot2.start) ||
      (slot2.start < slot1.end && slot2.end > slot1.start)
    );
  }

  /**
   * Check if a specific time slot is available
   */
  async isSlotAvailable(serviceId: string, startAt: Date, providerId?: string): Promise<boolean> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });

    if (!service) {
      return false;
    }

    const endAt = addMinutes(startAt, service.duration_minutes);
    const slot: TimeSlot = { start: startAt, end: endAt };

    // Get all booked slots for this day
    const bookedSlots = await this.getBookedSlots(serviceId, startAt, providerId);

    return !this.hasConflict(slot, bookedSlots);
  }
}
