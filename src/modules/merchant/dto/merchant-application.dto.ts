import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class BusinessAddressDto {
  @ApiProperty({ example: 'US' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: '10001' })
  @IsString()
  @IsNotEmpty()
  postal_code: string;

  @ApiPropertyOptional({ example: 'NY' })
  @IsString()
  @IsOptional()
  state?: string;
}

export class CreateMerchantApplicationDto {
  @ApiProperty({
    example: 'Alex Star Store LLC',
    description: 'Legal business name',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  legal_name: string;

  @ApiPropertyOptional({
    example: 'Alex Star Store',
    description: 'Display name for the store',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  display_name?: string;

  @ApiPropertyOptional({
    example: 'We sell amazing products',
    description: 'Store description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com',
    description: 'Store website URL',
  })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({
    example: '123-45-6789',
    description: 'Business tax ID',
  })
  @IsString()
  @IsOptional()
  tax_id?: string;

  @ApiPropertyOptional({
    type: BusinessAddressDto,
    description: 'Business address',
  })
  @ValidateNested()
  @Type(() => BusinessAddressDto)
  @IsOptional()
  business_address?: BusinessAddressDto;
}

export class ApproveMerchantApplicationDto {
  @ApiPropertyOptional({
    example: 'Application approved',
    description: 'Admin notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectMerchantApplicationDto {
  @ApiProperty({
    example: 'Insufficient documentation',
    description: 'Reason for rejection',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
