import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressResponseDto {
  @ApiProperty({
    description: 'Address ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user_id: string;

  @ApiProperty({
    description: 'Full name',
    example: 'John Doe',
  })
  full_name: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1 (555) 123-4567',
  })
  phone: string;

  @ApiProperty({
    description: 'Address line 1',
    example: '123 Main Street',
  })
  address_line1: string;

  @ApiPropertyOptional({
    description: 'Address line 2',
    example: 'Apartment 4B',
  })
  address_line2?: string | null;

  @ApiProperty({
    description: 'City',
    example: 'New York',
  })
  city: string;

  @ApiPropertyOptional({
    description: 'State or province',
    example: 'NY',
  })
  state?: string | null;

  @ApiProperty({
    description: 'Postal code',
    example: '10001',
  })
  postal_code: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'US',
  })
  country: string;

  @ApiProperty({
    description: 'Is this the default address',
    example: false,
  })
  is_default: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updated_at: Date;
}
