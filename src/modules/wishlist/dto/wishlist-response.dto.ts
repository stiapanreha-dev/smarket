import { ApiProperty } from '@nestjs/swagger';

/**
 * Wishlist item response DTO
 */
export class WishlistItemDto {
  @ApiProperty({ description: 'Wishlist item ID' })
  id: string;

  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Date added to wishlist' })
  createdAt: Date;

  @ApiProperty({ description: 'Product details', required: false })
  product?: {
    id: string;
    title: string;
    slug: string;
    imageUrl: string | null;
    basePriceMinor: number | null;
    currency: string;
    status: string;
    merchantId: string;
  };
}

/**
 * Wishlist response DTO
 */
export class WishlistResponseDto {
  @ApiProperty({ description: 'Wishlist ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Wishlist items', type: [WishlistItemDto] })
  items: WishlistItemDto[];

  @ApiProperty({ description: 'Total items count' })
  itemCount: number;

  @ApiProperty({ description: 'Date created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date last updated' })
  updatedAt: Date;
}
