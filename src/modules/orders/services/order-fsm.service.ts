import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import {
  OrderLineItem,
  LineItemType,
  PhysicalItemStatus,
  DigitalItemStatus,
  ServiceItemStatus,
} from '../../../database/entities/order-line-item.entity';
import { OrderStatusTransition } from '../../../database/entities/order-status-transition.entity';

export interface TransitionMetadata {
  reason?: string;
  user_id?: string;
  tracking_number?: string;
  carrier?: string;
  download_url?: string;
  [key: string]: any;
}

@Injectable()
export class OrderFSMService {
  private readonly logger = new Logger(OrderFSMService.name);

  // FSM Transition Rules
  private readonly transitions = {
    [LineItemType.PHYSICAL]: {
      [PhysicalItemStatus.PENDING]: [
        PhysicalItemStatus.PAYMENT_CONFIRMED,
        PhysicalItemStatus.CANCELLED,
      ],
      [PhysicalItemStatus.PAYMENT_CONFIRMED]: [
        PhysicalItemStatus.PREPARING,
        PhysicalItemStatus.CANCELLED,
      ],
      [PhysicalItemStatus.PREPARING]: [
        PhysicalItemStatus.READY_TO_SHIP,
        PhysicalItemStatus.CANCELLED,
      ],
      [PhysicalItemStatus.READY_TO_SHIP]: [
        PhysicalItemStatus.SHIPPED,
      ],
      [PhysicalItemStatus.SHIPPED]: [
        PhysicalItemStatus.OUT_FOR_DELIVERY,
        PhysicalItemStatus.DELIVERED,
      ],
      [PhysicalItemStatus.OUT_FOR_DELIVERY]: [
        PhysicalItemStatus.DELIVERED,
      ],
      [PhysicalItemStatus.DELIVERED]: [
        PhysicalItemStatus.REFUND_REQUESTED,
      ],
      [PhysicalItemStatus.REFUND_REQUESTED]: [
        PhysicalItemStatus.REFUNDED,
      ],
      [PhysicalItemStatus.CANCELLED]: [],
      [PhysicalItemStatus.REFUNDED]: [],
    },
    [LineItemType.DIGITAL]: {
      [DigitalItemStatus.PENDING]: [
        DigitalItemStatus.PAYMENT_CONFIRMED,
        DigitalItemStatus.CANCELLED,
      ],
      [DigitalItemStatus.PAYMENT_CONFIRMED]: [
        DigitalItemStatus.ACCESS_GRANTED,
        DigitalItemStatus.CANCELLED,
      ],
      [DigitalItemStatus.ACCESS_GRANTED]: [
        DigitalItemStatus.DOWNLOADED,
        DigitalItemStatus.REFUND_REQUESTED,
      ],
      [DigitalItemStatus.DOWNLOADED]: [
        DigitalItemStatus.REFUND_REQUESTED,
      ],
      [DigitalItemStatus.REFUND_REQUESTED]: [
        DigitalItemStatus.REFUNDED,
      ],
      [DigitalItemStatus.CANCELLED]: [],
      [DigitalItemStatus.REFUNDED]: [],
    },
    [LineItemType.SERVICE]: {
      [ServiceItemStatus.PENDING]: [
        ServiceItemStatus.PAYMENT_CONFIRMED,
        ServiceItemStatus.CANCELLED,
      ],
      [ServiceItemStatus.PAYMENT_CONFIRMED]: [
        ServiceItemStatus.BOOKING_CONFIRMED,
        ServiceItemStatus.CANCELLED,
      ],
      [ServiceItemStatus.BOOKING_CONFIRMED]: [
        ServiceItemStatus.REMINDER_SENT,
        ServiceItemStatus.CANCELLED,
      ],
      [ServiceItemStatus.REMINDER_SENT]: [
        ServiceItemStatus.IN_PROGRESS,
        ServiceItemStatus.NO_SHOW,
      ],
      [ServiceItemStatus.IN_PROGRESS]: [
        ServiceItemStatus.COMPLETED,
      ],
      [ServiceItemStatus.COMPLETED]: [
        ServiceItemStatus.REFUND_REQUESTED,
      ],
      [ServiceItemStatus.NO_SHOW]: [
        ServiceItemStatus.REFUND_REQUESTED,
      ],
      [ServiceItemStatus.REFUND_REQUESTED]: [
        ServiceItemStatus.REFUNDED,
      ],
      [ServiceItemStatus.CANCELLED]: [],
      [ServiceItemStatus.REFUNDED]: [],
    },
  };

  constructor(
    @InjectRepository(OrderLineItem)
    private readonly lineItemRepository: Repository<OrderLineItem>,
    @InjectRepository(OrderStatusTransition)
    private readonly transitionRepository: Repository<OrderStatusTransition>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Check if transition is allowed
   */
  canTransition(
    itemType: LineItemType,
    fromStatus: string,
    toStatus: string,
  ): boolean {
    const allowedTransitions = this.transitions[itemType]?.[fromStatus];
    if (!allowedTransitions) {
      return false;
    }
    return allowedTransitions.includes(toStatus);
  }

  /**
   * Get all allowed transitions for a given status
   */
  getAllowedTransitions(itemType: LineItemType, currentStatus: string): string[] {
    return this.transitions[itemType]?.[currentStatus] || [];
  }

  /**
   * Transition line item to new status with full transaction support
   */
  async transitionLineItem(
    lineItemId: string,
    toStatus: string,
    metadata?: TransitionMetadata,
    manager?: EntityManager,
  ): Promise<OrderLineItem> {
    const executeTransition = async (txManager: EntityManager) => {
      // 1. Load line item with row lock
      const lineItem = await txManager
        .getRepository(OrderLineItem)
        .createQueryBuilder('item')
        .where('item.id = :id', { id: lineItemId })
        .setLock('pessimistic_write')
        .getOne();

      if (!lineItem) {
        throw new BadRequestException(`Line item ${lineItemId} not found`);
      }

      const fromStatus = lineItem.status;

      // 2. Validate transition
      if (!this.canTransition(lineItem.type, fromStatus, toStatus)) {
        const allowed = this.getAllowedTransitions(lineItem.type, fromStatus);
        throw new BadRequestException(
          `Invalid transition from ${fromStatus} to ${toStatus} for ${lineItem.type} item. ` +
          `Allowed transitions: ${allowed.join(', ') || 'none'}`,
        );
      }

      // 3. Execute side effects BEFORE updating status
      await this.executeSideEffects(lineItem, fromStatus, toStatus, metadata, txManager);

      // 4. Update status
      lineItem.status = toStatus;
      lineItem.last_status_change = new Date();

      // 5. Add to status history
      const historyEntry = {
        from: fromStatus,
        to: toStatus,
        timestamp: new Date(),
        metadata: metadata || {},
      };
      lineItem.status_history = [...lineItem.status_history, historyEntry];

      await txManager.save(lineItem);

      // 6. Log transition to audit table
      const transition = txManager.create(OrderStatusTransition, {
        line_item_id: lineItem.id,
        order_id: lineItem.order_id,
        from_status: fromStatus,
        to_status: toStatus,
        reason: metadata?.reason,
        metadata: metadata || {},
        created_by: metadata?.user_id,
      });

      await txManager.save(transition);

      this.logger.log(
        `Line item ${lineItemId} transitioned from ${fromStatus} to ${toStatus}`,
      );

      return lineItem;
    };

    // Execute with or without external transaction
    if (manager) {
      return executeTransition(manager);
    } else {
      return this.dataSource.transaction(executeTransition);
    }
  }

  /**
   * Execute side effects based on status transition
   */
  private async executeSideEffects(
    lineItem: OrderLineItem,
    fromStatus: string,
    toStatus: string,
    metadata: TransitionMetadata | undefined,
    manager: EntityManager,
  ): Promise<void> {
    switch (lineItem.type) {
      case LineItemType.PHYSICAL:
        await this.executePhysicalItemSideEffects(
          lineItem,
          fromStatus as PhysicalItemStatus,
          toStatus as PhysicalItemStatus,
          metadata,
          manager,
        );
        break;
      case LineItemType.DIGITAL:
        await this.executeDigitalItemSideEffects(
          lineItem,
          fromStatus as DigitalItemStatus,
          toStatus as DigitalItemStatus,
          metadata,
          manager,
        );
        break;
      case LineItemType.SERVICE:
        await this.executeServiceItemSideEffects(
          lineItem,
          fromStatus as ServiceItemStatus,
          toStatus as ServiceItemStatus,
          metadata,
          manager,
        );
        break;
    }
  }

  /**
   * Physical item side effects
   */
  private async executePhysicalItemSideEffects(
    lineItem: OrderLineItem,
    fromStatus: PhysicalItemStatus,
    toStatus: PhysicalItemStatus,
    metadata: TransitionMetadata | undefined,
    manager: EntityManager,
  ): Promise<void> {
    switch (toStatus) {
      case PhysicalItemStatus.PAYMENT_CONFIRMED:
        // Confirm inventory reservation
        this.logger.debug(
          `Confirming inventory reservation for variant ${lineItem.variant_id}, qty: ${lineItem.quantity}`,
        );
        // TODO: Call inventory service to confirm reservation
        break;

      case PhysicalItemStatus.SHIPPED:
        // Add shipping information
        if (metadata?.tracking_number) {
          lineItem.fulfillment_data = {
            ...lineItem.fulfillment_data,
            tracking_number: metadata.tracking_number,
            carrier: metadata.carrier,
            shipped_at: new Date(),
          };
        }
        this.logger.debug(`Item ${lineItem.id} shipped with tracking ${metadata?.tracking_number}`);
        // TODO: Send shipment notification
        break;

      case PhysicalItemStatus.DELIVERED:
        lineItem.fulfillment_data = {
          ...lineItem.fulfillment_data,
          delivered_at: new Date(),
        };
        // TODO: Send delivery confirmation
        // TODO: Request review after 24h
        break;

      case PhysicalItemStatus.CANCELLED:
        // Release inventory
        this.logger.debug(
          `Releasing inventory for variant ${lineItem.variant_id}, qty: ${lineItem.quantity}`,
        );
        // TODO: Call inventory service to release reservation
        break;

      case PhysicalItemStatus.REFUNDED:
        // Process refund
        this.logger.debug(`Processing refund for line item ${lineItem.id}`);
        // TODO: Call payment service to process refund
        break;
    }
  }

  /**
   * Digital item side effects
   */
  private async executeDigitalItemSideEffects(
    lineItem: OrderLineItem,
    fromStatus: DigitalItemStatus,
    toStatus: DigitalItemStatus,
    metadata: TransitionMetadata | undefined,
    manager: EntityManager,
  ): Promise<void> {
    switch (toStatus) {
      case DigitalItemStatus.ACCESS_GRANTED:
        // Generate download link or access key
        const accessData = {
          download_url: metadata?.download_url || this.generateDownloadUrl(lineItem),
          access_key: this.generateAccessKey(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          download_count: 0,
          max_downloads: 5,
        };
        lineItem.fulfillment_data = {
          ...lineItem.fulfillment_data,
          ...accessData,
        };
        this.logger.debug(`Access granted for digital item ${lineItem.id}`);
        // TODO: Send email with download link
        break;

      case DigitalItemStatus.DOWNLOADED:
        const currentData = lineItem.fulfillment_data as any;
        lineItem.fulfillment_data = {
          ...currentData,
          download_count: (currentData.download_count || 0) + 1,
        };
        break;

      case DigitalItemStatus.REFUNDED:
        // Revoke access
        lineItem.fulfillment_data = {
          ...lineItem.fulfillment_data,
          download_url: null,
          access_key: null,
        };
        this.logger.debug(`Access revoked for digital item ${lineItem.id}`);
        // TODO: Process refund
        break;
    }
  }

  /**
   * Service item side effects
   */
  private async executeServiceItemSideEffects(
    lineItem: OrderLineItem,
    fromStatus: ServiceItemStatus,
    toStatus: ServiceItemStatus,
    metadata: TransitionMetadata | undefined,
    manager: EntityManager,
  ): Promise<void> {
    switch (toStatus) {
      case ServiceItemStatus.BOOKING_CONFIRMED:
        this.logger.debug(`Booking confirmed for service item ${lineItem.id}`);
        // TODO: Confirm booking slot
        // TODO: Send confirmation email
        break;

      case ServiceItemStatus.REMINDER_SENT:
        this.logger.debug(`Reminder sent for service item ${lineItem.id}`);
        // TODO: Send reminder notification
        break;

      case ServiceItemStatus.COMPLETED:
        lineItem.fulfillment_data = {
          ...lineItem.fulfillment_data,
          completed_at: new Date(),
        };
        // TODO: Request review
        break;

      case ServiceItemStatus.NO_SHOW:
        lineItem.fulfillment_data = {
          ...lineItem.fulfillment_data,
          no_show_at: new Date(),
        };
        // TODO: Apply no-show policy
        break;

      case ServiceItemStatus.CANCELLED:
        // Release booking slot
        this.logger.debug(`Releasing booking slot for service item ${lineItem.id}`);
        // TODO: Call booking service to release slot
        break;

      case ServiceItemStatus.REFUNDED:
        // Process refund based on policy
        this.logger.debug(`Processing refund for service item ${lineItem.id}`);
        // TODO: Apply refund policy
        // TODO: Process refund
        break;
    }
  }

  /**
   * Utility methods
   */
  private generateDownloadUrl(lineItem: OrderLineItem): string {
    // In production, this would generate a signed URL
    return `/api/v1/orders/downloads/${lineItem.id}/${this.generateAccessKey()}`;
  }

  private generateAccessKey(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get transition history for a line item
   */
  async getTransitionHistory(lineItemId: string): Promise<OrderStatusTransition[]> {
    return this.transitionRepository.find({
      where: { line_item_id: lineItemId },
      order: { created_at: 'ASC' },
      relations: ['created_by_user'],
    });
  }

  /**
   * Validate if refund is allowed based on business rules
   */
  canRefund(lineItem: OrderLineItem): { allowed: boolean; reason?: string } {
    if (lineItem.type === LineItemType.PHYSICAL) {
      const deliveredAt = (lineItem.fulfillment_data as any)?.delivered_at;
      if (!deliveredAt) {
        return { allowed: false, reason: 'Item not yet delivered' };
      }

      const daysSinceDelivery = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDelivery > 14) {
        return { allowed: false, reason: 'Refund period expired (14 days)' };
      }

      return { allowed: true };
    }

    if (lineItem.type === LineItemType.DIGITAL) {
      if (lineItem.status === DigitalItemStatus.ACCESS_GRANTED) {
        // Instant refund before first download
        const downloadCount = (lineItem.fulfillment_data as any)?.download_count || 0;
        if (downloadCount === 0) {
          return { allowed: true };
        }
      }

      const grantedAt = lineItem.last_status_change;
      if (grantedAt) {
        const daysSinceGrant = (Date.now() - new Date(grantedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceGrant <= 7) {
          return { allowed: true };
        }
      }

      return { allowed: false, reason: 'Refund period expired (7 days)' };
    }

    if (lineItem.type === LineItemType.SERVICE) {
      const bookingDate = (lineItem.fulfillment_data as any)?.booking_date;
      if (bookingDate) {
        const hoursUntilBooking = (new Date(bookingDate).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntilBooking < 24) {
          return { allowed: false, reason: 'Cannot cancel within 24h of appointment' };
        }
      }

      return { allowed: true };
    }

    return { allowed: false, reason: 'Unknown item type' };
  }
}
