import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  IsInt,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType, ProductStatus } from '../../../database/entities/product.entity';
import { TranslationLocale } from '../../../database/entities/product-translation.entity';

export class SearchProductsDto {
  @ApiPropertyOptional({
    description: 'Search query (searches in product name and description)',
    example: 'wireless headphones',
  })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({
    enum: ProductType,
    description: 'Filter by product type',
    example: ProductType.PHYSICAL,
  })
  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @ApiPropertyOptional({
    enum: ProductStatus,
    description: 'Filter by product status',
    example: ProductStatus.ACTIVE,
  })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiPropertyOptional({
    description: 'Filter by merchant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  merchant_id?: string;

  @ApiPropertyOptional({
    description: 'Minimum price in minor units (cents)',
    example: 1000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  min_price?: number;

  @ApiPropertyOptional({
    description: 'Maximum price in minor units (cents)',
    example: 100000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  max_price?: number;

  @ApiPropertyOptional({
    description: 'Filter by product attributes',
    example: { brand: 'TechBrand', color: 'black' },
  })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, any>;

  @ApiPropertyOptional({
    enum: ['price_asc', 'price_desc', 'newest', 'popular', 'rating'],
    description: 'Sort order',
    example: 'price_asc',
    default: 'newest',
  })
  @IsEnum(['price_asc', 'price_desc', 'newest', 'popular', 'rating'])
  @IsOptional()
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating';

  @ApiPropertyOptional({
    enum: TranslationLocale,
    description: 'Locale for translations',
    example: TranslationLocale.EN,
    default: TranslationLocale.EN,
  })
  @IsEnum(TranslationLocale)
  @IsOptional()
  locale?: TranslationLocale;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Number of items to skip',
    example: 0,
    default: 0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  offset?: number = 0;
}
