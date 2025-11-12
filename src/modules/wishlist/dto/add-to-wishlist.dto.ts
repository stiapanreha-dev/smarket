import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for adding a product to wishlist
 */
export class AddToWishlistDto {
  @ApiProperty({
    description: 'Product ID to add to wishlist',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;
}
