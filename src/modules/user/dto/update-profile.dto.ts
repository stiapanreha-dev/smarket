import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsPhoneNumber,
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  IsDateString,
  IsUrl,
  IsObject,
} from 'class-validator';
import { UserLocale, UserCurrency } from '@/database/entities/user.entity';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  last_name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsUrl()
  @IsOptional()
  @MaxLength(500)
  avatar_url?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsDateString()
  @IsOptional()
  date_of_birth?: string;

  @ApiPropertyOptional({ enum: UserLocale, example: UserLocale.EN })
  @IsEnum(UserLocale)
  @IsOptional()
  locale?: UserLocale;

  @ApiPropertyOptional({ enum: UserCurrency, example: UserCurrency.USD })
  @IsEnum(UserCurrency)
  @IsOptional()
  currency?: UserCurrency;

  @ApiPropertyOptional({
    example: {
      notifications: {
        email_notifications: true,
        order_updates: true,
        promotions: false,
        newsletter: false,
      },
      privacy: {
        profile_visibility: 'public',
        show_email: false,
        show_phone: false,
      },
    },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
