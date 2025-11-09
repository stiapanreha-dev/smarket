import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Service, Booking, BookingStatus, OrderLineItem } from '@database/entities';
import { CacheService } from '@common/services/cache.service';
import { SlotAvailabilityService } from './slot-availability.service';
import { CreateBookingDto, CancelBookingDto } from '../dto';
import { addMinutes, differenceInHours } from 'date-fns';

export class SlotNotAvailableError extends ConflictException {
  constructor(message: string) {
    super(message);
  }
}

export class CancellationNotAllowedError extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  private readonly LOCK_TTL_SECONDS = 900; // 15 minutes
  private readonly DEFAULT_CANCELLATION_WINDOW_HOURS = 24;

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(OrderLineItem)
    private readonly orderLineItemRepository: Repository<OrderLineItem>,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    private readonly slotAvailabilityService: SlotAvailabilityService,
  ) {}

  /**
   * Create a new booking with atomic slot reservation
   */
  async createBooking(
    customerId: string,
    dto: CreateBookingDto,
    orderLineItemId?: string,
  ): Promise<Booking> {
    this.logger.log(`Creating booking for customer ${customerId}, service ${dto.service_id}`);

    // 1. Load service
    const service = await this.serviceRepository.findOne({
      where: { id: dto.service_id },
    });

    if (!service) {
      throw new NotFoundException(`Service ${dto.service_id} not found`);
    }

    if (!service.is_active) {
      throw new BadRequestException('Service is not active');
    }

    // 2. Calculate end time
    const startAt = new Date(dto.start_at);
    const endAt = addMinutes(startAt, service.duration_minutes);

    // 3. Validate time is in the future
    if (startAt <= new Date()) {
      throw new BadRequestException('Booking time must be in the future');
    }

    // 4. Acquire Redis lock for this slot
    const lockKey = this.getLockKey(dto.service_id, dto.provider_id, startAt);

    const locked = await this.acquireLock(lockKey);

    if (!locked) {
      throw new SlotNotAvailableError(
        'Slot is currently being booked by another user. Please try again.',
      );
    }

    try {
      // 5. Create booking within transaction
      return await this.dataSource.transaction(async (manager) => {
        // Double-check availability in DB
        const existingBooking = await manager.findOne(Booking, {
          where: {
            service_id: dto.service_id,
            provider_id: dto.provider_id || null,
            start_at: startAt,
          },
        });

        if (existingBooking) {
          throw new SlotNotAvailableError('Slot is already booked');
        }

        // Create booking
        const booking = manager.create(Booking, {
          service_id: dto.service_id,
          customer_id: customerId,
          provider_id: dto.provider_id,
          order_line_item_id: orderLineItemId,
          start_at: startAt,
          end_at: endAt,
          timezone: dto.timezone || 'UTC',
          status: BookingStatus.PENDING,
          customer_notes: dto.customer_notes,
        });

        const savedBooking = await manager.save(Booking, booking);

        this.logger.log(`Booking ${savedBooking.id} created successfully`);

        // Invalidate availability cache
        await this.invalidateAvailabilityCache(dto.service_id, startAt);

        return savedBooking;
      });
    } finally {
      // Lock will auto-expire via TTL, but we can release it early
      // Note: In production, consider implementing explicit lock release
      // with Lua scripts to ensure atomicity
    }
  }

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string, userId?: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['service', 'customer', 'provider'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    // Optional: Verify user has access to this booking
    if (userId && booking.customer_id !== userId && booking.provider_id !== userId) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    return booking;
  }

  /**
   * Get bookings for a customer
   */
  async getCustomerBookings(customerId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { customer_id: customerId },
      relations: ['service', 'provider'],
      order: { start_at: 'DESC' },
    });
  }

  /**
   * Get bookings for a provider
   */
  async getProviderBookings(providerId: string, status?: BookingStatus): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: {
        provider_id: providerId,
        ...(status && { status }),
      },
      relations: ['service', 'customer'],
      order: { start_at: 'ASC' },
    });
  }

  /**
   * Cancel a booking with policy enforcement
   */
  async cancelBooking(bookingId: string, userId: string, dto: CancelBookingDto): Promise<Booking> {
    this.logger.log(`Cancelling booking ${bookingId} by user ${userId}`);

    return await this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(Booking, {
        where: { id: bookingId },
        relations: ['service', 'order_line_item'],
      });

      if (!booking) {
        throw new NotFoundException(`Booking ${bookingId} not found`);
      }

      // Check if user has permission to cancel
      if (booking.customer_id !== userId && booking.provider_id !== userId) {
        throw new BadRequestException('You do not have permission to cancel this booking');
      }

      // Check if booking can be cancelled
      if (!booking.is_cancellable) {
        throw new CancellationNotAllowedError(
          `Booking cannot be cancelled in status: ${booking.status}`,
        );
      }

      // Check cancellation window (24 hours by default)
      const hoursUntilStart = differenceInHours(booking.start_at, new Date());

      if (hoursUntilStart < this.DEFAULT_CANCELLATION_WINDOW_HOURS) {
        throw new CancellationNotAllowedError(
          `Cannot cancel less than ${this.DEFAULT_CANCELLATION_WINDOW_HOURS}h before appointment`,
        );
      }

      // Update booking
      booking.status = BookingStatus.CANCELLED;
      booking.cancellation_reason = dto.reason;
      booking.cancelled_at = new Date();
      booking.cancelled_by = userId;

      const updatedBooking = await manager.save(Booking, booking);

      // TODO: Initiate refund if payment was made
      if (booking.order_line_item_id) {
        // await this.refundService.initiateRefund(booking.order_line_item_id, manager);
        this.logger.log(`Refund needed for order line item ${booking.order_line_item_id}`);
      }

      // Invalidate cache
      await this.invalidateAvailabilityCache(booking.service_id, booking.start_at);

      this.logger.log(`Booking ${bookingId} cancelled successfully`);

      return updatedBooking;
    });
  }

  /**
   * Confirm a booking (transition from PENDING to CONFIRMED)
   */
  async confirmBooking(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(`Cannot confirm booking in status: ${booking.status}`);
    }

    booking.status = BookingStatus.CONFIRMED;
    return this.bookingRepository.save(booking);
  }

  /**
   * Mark booking as in progress
   */
  async startBooking(bookingId: string, providerId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, provider_id: providerId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(`Cannot start booking in status: ${booking.status}`);
    }

    booking.status = BookingStatus.IN_PROGRESS;
    return this.bookingRepository.save(booking);
  }

  /**
   * Complete a booking
   */
  async completeBooking(
    bookingId: string,
    providerId: string,
    providerNotes?: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, provider_id: providerId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    if (
      booking.status !== BookingStatus.IN_PROGRESS &&
      booking.status !== BookingStatus.CONFIRMED
    ) {
      throw new BadRequestException(`Cannot complete booking in status: ${booking.status}`);
    }

    booking.status = BookingStatus.COMPLETED;
    booking.completed_at = new Date();
    booking.provider_notes = providerNotes;

    return this.bookingRepository.save(booking);
  }

  /**
   * Mark booking as no-show
   */
  async markNoShow(bookingId: string, providerId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, provider_id: providerId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(`Cannot mark as no-show in status: ${booking.status}`);
    }

    booking.status = BookingStatus.NO_SHOW;
    booking.no_show_at = new Date();

    return this.bookingRepository.save(booking);
  }

  /**
   * Acquire a Redis lock for a booking slot
   */
  private async acquireLock(key: string): Promise<boolean> {
    try {
      // SET key "locked" NX EX ttl
      // Returns true if lock acquired, false if already exists
      const result = await this.cacheService['redis'].set(
        key,
        'locked',
        'NX',
        'EX',
        this.LOCK_TTL_SECONDS,
      );
      return result === 'OK';
    } catch (error) {
      this.logger.error(`Failed to acquire lock ${key}:`, error);
      return false;
    }
  }

  /**
   * Generate Redis lock key for a booking slot
   */
  private getLockKey(serviceId: string, providerId: string | undefined, startAt: Date): string {
    const timestamp = startAt.toISOString();
    return `booking:lock:${serviceId}:${providerId || 'any'}:${timestamp}`;
  }

  /**
   * Invalidate availability cache for a service/date
   */
  private async invalidateAvailabilityCache(serviceId: string, date: Date): Promise<void> {
    const cacheKey = `availability:${serviceId}:*`;
    await this.cacheService.deletePattern(cacheKey);
  }
}
