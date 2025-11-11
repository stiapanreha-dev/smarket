import { IsString, IsBoolean, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({
    description: 'Full name for the address',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  full_name: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1 (555) 123-4567',
  })
  @IsString()
  @Matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, {
    message: 'Phone number is not valid',
  })
  phone: string;

  @ApiProperty({
    description: 'Address line 1',
    example: '123 Main Street',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  address_line1: string;

  @ApiPropertyOptional({
    description: 'Address line 2',
    example: 'Apartment 4B',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  address_line2?: string;

  @ApiProperty({
    description: 'City',
    example: 'New York',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional({
    description: 'State or province',
    example: 'NY',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  @ApiProperty({
    description: 'Postal code',
    example: '10001',
  })
  @IsString()
  @Matches(/^[A-Z0-9\s-]{3,10}$/i, {
    message: 'Postal code is not valid',
  })
  postal_code: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'US',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country: string;

  @ApiPropertyOptional({
    description: 'Set this address as default',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}
