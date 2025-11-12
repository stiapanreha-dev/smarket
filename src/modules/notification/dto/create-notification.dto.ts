import { IsEnum, IsString, IsOptional, IsObject, IsUUID } from 'class-validator';
import { NotificationType } from '@database/entities';

export class CreateNotificationDto {
  @IsUUID()
  user_id: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  related_url?: string;
}
