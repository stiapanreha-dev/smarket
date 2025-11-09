import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan, IsNull } from 'typeorm';
import { Booking, BookingStatus } from '@database/entities';
import { addHours } from 'date-fns';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);
  private isProcessing = false;

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /**
   * Send reminders for bookings happening in the next 24 hours
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'send-booking-reminders',
    timeZone: 'UTC',
  })
  async sendReminders(): Promise<void> {
    if (this.isProcessing) {
      this.logger.warn('Reminder job already running, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      this.logger.log('Starting booking reminder job');

      const now = new Date();
      const reminderWindowStart = addHours(now, 23); // 23 hours from now
      const reminderWindowEnd = addHours(now, 24); // 24 hours from now

      // Find bookings that:
      // 1. Start between 23-24 hours from now
      // 2. Are in PENDING or CONFIRMED status
      // 3. Haven't received a reminder yet
      const bookings = await this.bookingRepository.find({
        where: {
          start_at: MoreThan(reminderWindowStart) as any,
          status: BookingStatus.CONFIRMED as any,
          reminder_sent_at: IsNull() as any,
        },
        relations: ['service', 'customer', 'provider'],
      });

      this.logger.log(`Found ${bookings.length} bookings needing reminders`);

      let successCount = 0;
      let failureCount = 0;

      for (const booking of bookings) {
        try {
          // Check if booking actually starts within 24 hours
          if (booking.start_at <= reminderWindowEnd) {
            await this.sendReminderNotification(booking);

            // Mark reminder as sent
            booking.reminder_sent_at = new Date();
            await this.bookingRepository.save(booking);

            successCount++;
          }
        } catch (error) {
          this.logger.error(
            `Failed to send reminder for booking ${booking.id}:`,
            error,
          );
          failureCount++;
        }
      }

      this.logger.log(
        `Reminder job completed: ${successCount} sent, ${failureCount} failed`,
      );
    } catch (error) {
      this.logger.error('Error in reminder job:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Send reminder notification to customer
   */
  private async sendReminderNotification(booking: Booking): Promise<void> {
    this.logger.log(
      `Sending reminder for booking ${booking.id} to customer ${booking.customer_id}`,
    );

    // TODO: Integrate with notification service
    // This would send an email/SMS to the customer
    /*
    await this.notificationService.send({
      type: 'booking_reminder',
      recipient_id: booking.customer_id,
      template_data: {
        booking_id: booking.id,
        service_name: booking.service.name,
        start_at: booking.start_at,
        provider_name: booking.provider?.name,
        customer_notes: booking.customer_notes,
      },
      channels: ['email', 'sms'],
    });
    */

    // For now, just log
    this.logger.log(
      `Reminder notification would be sent for booking ${booking.id}`,
    );
  }

  /**
   * Manually send a reminder for a specific booking
   */
  async sendManualReminder(bookingId: string): Promise<void> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['service', 'customer', 'provider'],
    });

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.CONFIRMED
    ) {
      throw new Error(
        `Cannot send reminder for booking in status: ${booking.status}`,
      );
    }

    await this.sendReminderNotification(booking);

    booking.reminder_sent_at = new Date();
    await this.bookingRepository.save(booking);

    this.logger.log(`Manual reminder sent for booking ${bookingId}`);
  }
}
