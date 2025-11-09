import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsUUID,
  Min,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceCategory } from '@database/entities/service.entity';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Merchant ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  merchant_id: string;

  @ApiPropertyOptional({
    description: 'Specific provider (user) ID for this service',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsOptional()
  provider_id?: string;

  @ApiProperty({
    description: 'Service name',
    example: 'Men\'s Haircut',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: 'Professional men\'s haircut with styling',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Service category',
    enum: ServiceCategory,
    example: ServiceCategory.HAIRCUT,
  })
  @IsEnum(ServiceCategory)
  @IsOptional()
  category?: ServiceCategory;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 60,
  })
  @IsInt()
  @Min(1)
  duration_minutes: number;

  @ApiPropertyOptional({
    description: 'Buffer time between appointments in minutes',
    example: 15,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  buffer_minutes?: number;

  @ApiProperty({
    description: 'Price in minor units (cents)',
    example: 5000,
  })
  @IsInt()
  @Min(0)
  price_minor: number;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'USD',
    default: 'USD',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { skill_level: 'senior', requires_consultation: false },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
