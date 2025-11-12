import { IsString, IsNotEmpty, IsOptional, IsUrl, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BecomeMerchantDto {
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
    example: {
      country: 'US',
      city: 'New York',
      street: '123 Main St',
      postal_code: '10001',
      state: 'NY',
    },
    description: 'Business address',
  })
  @IsOptional()
  business_address?: {
    country: string;
    city: string;
    street: string;
    postal_code: string;
    state?: string;
  };
}
