import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CacheService } from '../../../common/services/cache.service';
import { ProductVariant } from '../../../database/entities/product-variant.entity';
import { CartItemSnapshot } from '../../../database/entities/checkout-session.entity';

interface ReservationResult {
  success: boolean;
  reservationId: string;
  errors?: { variantId: string; reason: string }[];
}

interface BookingSlot {
  serviceId: string;
  variantId: string;
  date: string;
  timeSlot: string;
  duration: number; // minutes
}

@Injectable()
export class InventoryReservationService {
  private readonly logger = new Logger(InventoryReservationService.name);
  private readonly RESERVATION_TTL = 15 * 60; // 15 minutes in seconds
  private readonly BOOKING_RESERVATION_TTL = 15 * 60; // 15 minutes for booking slots

  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    private readonly cacheService: CacheService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Reserve inventory for checkout session
   * Uses Redis for TTL-based reservations with pessimistic locking
   */
  async reserveInventory(
    checkoutSessionId: string,
    items: CartItemSnapshot[],
  ): Promise<ReservationResult> {
    const reservationId = `reservation:${checkoutSessionId}`;
    const errors: { _variantId: string; reason: string }[] = [];

    // Use transaction for inventory checks and updates
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE'); // Highest isolation level

    try {
      // 1. Reserve physical/digital products
      const productItems = items.filter((item) => ['physical', 'digital'].includes(item.type));
      for (const item of productItems) {
        const success = await this.reserveProductVariant(item, reservationId, queryRunner);
        if (!success) {
          errors.push({
            variantId: item.variantId,
            reason: 'Insufficient inventory',
          });
        }
      }

      // 2. Reserve booking slots for services
      const serviceItems = items.filter((item) => item.type === 'service');
      for (const item of serviceItems) {
        const success = await this.reserveBookingSlot(item, reservationId);
        if (!success) {
          errors.push({
            variantId: item.variantId,
            reason: 'Booking slot unavailable',
          });
        }
      }

      if (errors.length > 0) {
        await queryRunner.rollbackTransaction();
        return { success: false, reservationId, errors };
      }

      await queryRunner.commitTransaction();

      // Store reservation metadata in Redis
      await this.storeReservationMetadata(reservationId, items);

      this.logger.log(`Inventory reserved for checkout session ${checkoutSessionId}`);
      return { success: true, reservationId };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to reserve inventory', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Reserve a product variant with pessimistic locking
   */
  private async reserveProductVariant(
    item: CartItemSnapshot,
    _reservationId: string,
    queryRunner: any,
  ): Promise<boolean> {
    // Lock the row for update
    const variant = await queryRunner.manager
      .createQueryBuilder(ProductVariant, 'variant')
      .where('variant.id = :id', { id: item.variantId })
      .setLock('pessimistic_write')
      .getOne();

    if (!variant) {
      this.logger.warn(`Variant not found: ${item.variantId}`);
      return false;
    }

    // Check inventory policy
    if (variant.inventory_policy === 'continue') {
      // No enforcement - always succeed
      return true;
    }

    // Check if sufficient inventory available
    const reservedKey = `inventory:reserved:${item.variantId}`;
    const currentReserved = (await this.cacheService.get<number>(reservedKey)) || 0;
    const availableQuantity = variant.inventory_quantity - currentReserved;

    if (availableQuantity < item.quantity) {
      this.logger.warn(
        `Insufficient inventory for variant ${item.variantId}: ` +
          `requested ${item.quantity}, available ${availableQuantity}`,
      );
      return false;
    }

    // Reserve in Redis with TTL
    const newReserved = currentReserved + item.quantity;
    await this.cacheService.set(reservedKey, newReserved, this.RESERVATION_TTL);

    // Store reservation details
    const reservationDetailKey = `${reservationId}:variant:${item.variantId}`;
    await this.cacheService.set(
      reservationDetailKey,
      { variantId: item.variantId, quantity: item.quantity },
      this.RESERVATION_TTL,
    );

    return true;
  }

  /**
   * Reserve booking slot for service
   */
  private async reserveBookingSlot(
    item: CartItemSnapshot,
    _reservationId: string,
  ): Promise<boolean> {
    if (!item.metadata?.bookingDate || !item.metadata?.bookingSlot) {
      this.logger.warn(`Service item ${item.variantId} missing booking details`);
      return false;
    }

    const slot: BookingSlot = {
      serviceId: item.productId,
      variantId: item.variantId,
      date: item.metadata.bookingDate,
      timeSlot: item.metadata.bookingSlot,
      duration: item.metadata.duration || 60,
    };

    // Check if slot is available
    const slotKey = `booking:slot:${slot.variantId}:${slot.date}:${slot.timeSlot}`;
    const slotReservations = (await this.cacheService.get<string[]>(slotKey)) || [];

    // Get max capacity for this slot (in production, get from database)
    const maxCapacity = await this.getSlotCapacity(slot.variantId);

    if (slotReservations.length >= maxCapacity) {
      this.logger.warn(`Booking slot full: ${slotKey}`);
      return false;
    }

    // Reserve slot
    slotReservations.push(reservationId);
    await this.cacheService.set(slotKey, slotReservations, this.BOOKING_RESERVATION_TTL);

    // Store reservation details
    const reservationDetailKey = `${reservationId}:booking:${item.variantId}`;
    await this.cacheService.set(reservationDetailKey, slot, this.BOOKING_RESERVATION_TTL);

    return true;
  }

  /**
   * Release inventory reservations when checkout is cancelled or expired
   */
  async releaseReservation(checkoutSessionId: string): Promise<void> {
    const reservationId = `reservation:${checkoutSessionId}`;

    try {
      // Get reservation metadata
      const metadata = await this.cacheService.get<{
        items: CartItemSnapshot[];
      }>(`${reservationId}:metadata`);

      if (!metadata) {
        this.logger.warn(`No reservation metadata found for ${reservationId}`);
        return;
      }

      // Release product reservations
      for (const item of metadata.items) {
        if (['physical', 'digital'].includes(item.type)) {
          await this.releaseProductReservation(item.variantId, item.quantity);
        }
      }

      // Release booking slot reservations
      for (const item of metadata.items) {
        if (item.type === 'service') {
          await this.releaseBookingReservation(item, reservationId);
        }
      }

      // Clean up reservation metadata
      await this.cacheService.delete(`${reservationId}:metadata`);

      this.logger.log(`Released reservations for ${checkoutSessionId}`);
    } catch (error) {
      this.logger.error(`Failed to release reservation ${reservationId}`, error);
    }
  }

  /**
   * Release product inventory reservation
   */
  private async releaseProductReservation(_variantId: string, quantity: number): Promise<void> {
    const reservedKey = `inventory:reserved:${variantId}`;
    const currentReserved = (await this.cacheService.get<number>(reservedKey)) || 0;
    const newReserved = Math.max(0, currentReserved - quantity);

    if (newReserved === 0) {
      await this.cacheService.delete(reservedKey);
    } else {
      await this.cacheService.set(reservedKey, newReserved, this.RESERVATION_TTL);
    }
  }

  /**
   * Release booking slot reservation
   */
  private async releaseBookingReservation(
    item: CartItemSnapshot,
    _reservationId: string,
  ): Promise<void> {
    if (!item.metadata?.bookingDate || !item.metadata?.bookingSlot) {
      return;
    }

    const slotKey = `booking:slot:${item.variantId}:${item.metadata.bookingDate}:${item.metadata.bookingSlot}`;
    const slotReservations = (await this.cacheService.get<string[]>(slotKey)) || [];

    const updatedReservations = slotReservations.filter((id) => id !== reservationId);

    if (updatedReservations.length === 0) {
      await this.cacheService.delete(slotKey);
    } else {
      await this.cacheService.set(slotKey, updatedReservations, this.BOOKING_RESERVATION_TTL);
    }
  }

  /**
   * Commit reservation to actual inventory (after payment success)
   */
  async commitReservation(checkoutSessionId: string, items: CartItemSnapshot[]): Promise<void> {
    const reservationId = `reservation:${checkoutSessionId}`;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update actual inventory quantities
      for (const item of items) {
        if (['physical', 'digital'].includes(item.type)) {
          await this.commitProductInventory(item, queryRunner);
        }
      }

      // Booking slots are already reserved, just need to mark as confirmed
      // (In production, update booking table with order_id)

      await queryRunner.commitTransaction();

      // Clean up reservation in Redis
      await this.releaseReservation(checkoutSessionId);

      this.logger.log(`Committed reservation for ${checkoutSessionId}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to commit reservation', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Commit product inventory update
   */
  private async commitProductInventory(item: CartItemSnapshot, queryRunner: any): Promise<void> {
    const variant = await queryRunner.manager
      .createQueryBuilder(ProductVariant, 'variant')
      .where('variant.id = :id', { id: item.variantId })
      .setLock('pessimistic_write')
      .getOne();

    if (!variant) {
      throw new BadRequestException(`Variant not found: ${item.variantId}`);
    }

    if (variant.inventory_policy === 'continue') {
      return; // No inventory tracking
    }

    // Decrease inventory
    const newQuantity = Math.max(0, variant.inventory_quantity - item.quantity);
    await queryRunner.manager.update(
      ProductVariant,
      { id: item.variantId },
      { inventory_quantity: newQuantity },
    );

    this.logger.log(
      `Updated inventory for variant ${item.variantId}: ${variant.inventory_quantity} -> ${newQuantity}`,
    );
  }

  /**
   * Store reservation metadata
   */
  private async storeReservationMetadata(
    _reservationId: string,
    items: CartItemSnapshot[],
  ): Promise<void> {
    await this.cacheService.set(`${reservationId}:metadata`, { items }, this.RESERVATION_TTL);
  }

  /**
   * Get booking slot capacity
   * In production, query from database
   */
  private async getSlotCapacity(_variantId: string): Promise<number> {
    // Mock capacity - in production, get from variant or service configuration
    return 5;
  }

  /**
   * Extend reservation TTL (e.g., when user is actively checking out)
   */
  async extendReservation(checkoutSessionId: string): Promise<void> {
    const reservationId = `reservation:${checkoutSessionId}`;

    const metadata = await this.cacheService.get<{ items: CartItemSnapshot[] }>(
      `${reservationId}:metadata`,
    );

    if (!metadata) {
      throw new BadRequestException('Reservation not found or expired');
    }

    // Extend TTL for all reservation keys
    await this.cacheService.set(`${reservationId}:metadata`, metadata, this.RESERVATION_TTL);

    for (const item of metadata.items) {
      if (['physical', 'digital'].includes(item.type)) {
        const reservedKey = `inventory:reserved:${item.variantId}`;
        const reserved = await this.cacheService.get<number>(reservedKey);
        if (reserved !== null) {
          await this.cacheService.set(reservedKey, reserved, this.RESERVATION_TTL);
        }
      }
    }

    this.logger.log(`Extended reservation TTL for ${checkoutSessionId}`);
  }
}
