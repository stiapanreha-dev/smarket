import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Product variant ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({
    description: 'Quantity to add',
    example: 1,
    minimum: 1,
    maximum: 99,
  })
  @IsNumber()
  @Min(1)
  @Max(99)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Additional metadata for the cart item (e.g., booking info)',
    example: {
      bookingDate: '2024-02-10T10:00:00Z',
      bookingSlot: 'morning',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: {
    bookingDate?: Date;
    bookingSlot?: string;
    customization?: Record<string, any>;
  };
}
