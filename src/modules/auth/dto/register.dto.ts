import { IsEmail, IsString, MinLength, Matches, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserLocale, UserCurrency } from '@/database/entities/user.entity';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    example: 'SecureP@ss123',
    description:
      'Password (min 8 chars, must include uppercase, lowercase, digit, special character)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special character (@$!%*?&)',
  })
  password: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Phone number (optional)',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    enum: UserLocale,
    example: UserLocale.EN,
    description: 'Preferred locale (optional, auto-detected if not provided)',
  })
  @IsOptional()
  @IsEnum(UserLocale)
  locale?: UserLocale;

  @ApiPropertyOptional({
    enum: UserCurrency,
    example: UserCurrency.USD,
    description: 'Preferred currency (optional, auto-detected if not provided)',
  })
  @IsOptional()
  @IsEnum(UserCurrency)
  currency?: UserCurrency;
}
