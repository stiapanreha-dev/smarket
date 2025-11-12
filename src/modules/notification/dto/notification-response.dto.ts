import { NotificationType } from '@database/entities';

export class NotificationResponseDto {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  related_url?: string;
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
}
