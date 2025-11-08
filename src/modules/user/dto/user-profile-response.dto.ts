import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserLocale, UserCurrency, UserRole } from '@/database/entities/user.entity';
import { Merchant } from '@/database/entities/merchant.entity';

export class UserProfileResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  phone?: string | null;

  @ApiPropertyOptional({ example: 'John' })
  first_name?: string | null;

  @ApiPropertyOptional({ example: 'Doe' })
  last_name?: string | null;

  @ApiProperty({ example: 'John Doe' })
  full_name: string;

  @ApiProperty({ enum: UserLocale, example: UserLocale.EN })
  locale: UserLocale;

  @ApiProperty({ enum: UserCurrency, example: UserCurrency.USD })
  currency: UserCurrency;

  @ApiProperty({ enum: UserRole, example: UserRole.BUYER })
  role: UserRole;

  @ApiProperty({ example: false })
  email_verified: boolean;

  @ApiProperty({ example: false })
  phone_verified: boolean;

  @ApiPropertyOptional()
  last_login_at?: Date | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({ type: [Object] })
  merchants?: Partial<Merchant>[];
}
