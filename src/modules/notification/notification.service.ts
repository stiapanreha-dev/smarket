import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '@database/entities';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(dto);
    return this.notificationRepository.save(notification);
  }

  async findAll(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<{ data: NotificationResponseDto[]; total: number; page: number; limit: number }> {
    const { unread, type, page = 1, limit = 20 } = query;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId })
      .orderBy('notification.created_at', 'DESC');

    if (unread !== undefined) {
      queryBuilder.andWhere('notification.is_read = :isRead', { isRead: !unread });
    }

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.is_read) {
      notification.is_read = true;
      notification.read_at = new Date();
      await this.notificationRepository.save(notification);
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({
        is_read: true,
        read_at: new Date(),
      })
      .where('user_id = :userId', { userId })
      .andWhere('is_read = :isRead', { isRead: false })
      .execute();

    return { updated: result.affected || 0 };
  }

  async getRecentNotifications(
    userId: string,
    limit: number = 5,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async createOrderNotification(
    userId: string,
    type: NotificationType,
    orderId: string,
    title: string,
    message: string,
  ): Promise<Notification> {
    return this.create({
      user_id: userId,
      type,
      title,
      message,
      metadata: { order_id: orderId },
      related_url: `/orders/${orderId}`,
    });
  }
}
