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
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType, ProductStatus } from '../../../database/entities/product.entity';
import { TranslationLocale } from '../../../database/entities/product-translation.entity';

export enum SortOption {
  RELEVANCE = 'relevance',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  CREATED_AT_DESC = 'created_at_desc',
  POPULARITY = 'popularity',
  RATING = 'rating',
}

export enum AvailabilityFilter {
  IN_STOCK = 'in_stock',
  OUT_OF_STOCK = 'out_of_stock',
  ALL = 'all',
}

export class AdvancedSearchProductsDto {
  @ApiPropertyOptional({
    description: 'Full-text search query (searches in title, description, SKU)',
    example: 'laptop gaming',
  })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({
    enum: ProductType,
    isArray: true,
    description: 'Filter by product types (can select multiple)',
    example: [ProductType.PHYSICAL],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ProductType, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  type?: ProductType[];

  @ApiPropertyOptional({
    enum: ProductStatus,
    description: 'Filter by product status',
    example: ProductStatus.ACTIVE,
    default: ProductStatus.ACTIVE,
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
    example: 50000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  price_min?: number;

  @ApiPropertyOptional({
    description: 'Maximum price in minor units (cents)',
    example: 200000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  price_max?: number;

  @ApiPropertyOptional({
    description: 'Filter by product attributes (dynamic JSONB fields)',
    example: { brand: 'Apple', color: 'black' },
  })
  @IsObject()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    return value;
  })
  attributes?: Record<string, any>;

  @ApiPropertyOptional({
    enum: AvailabilityFilter,
    description: 'Filter by stock availability',
    example: AvailabilityFilter.IN_STOCK,
    default: AvailabilityFilter.ALL,
  })
  @IsEnum(AvailabilityFilter)
  @IsOptional()
  availability?: AvailabilityFilter;

  @ApiPropertyOptional({
    description: 'Search by SKU (supports fuzzy matching)',
    example: 'SKU-123',
  })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({
    enum: SortOption,
    description: 'Sort order',
    example: SortOption.RELEVANCE,
    default: SortOption.RELEVANCE,
  })
  @IsEnum(SortOption)
  @IsOptional()
  sort?: SortOption;

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
    description: 'Number of items to skip (offset-based pagination)',
    example: 0,
    default: 0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'Cursor for cursor-based pagination (next_cursor from previous response)',
    example: 'eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAxIn0=',
  })
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Include faceted search results (aggregations)',
    example: true,
    default: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  include_facets?: boolean = false;

  @ApiPropertyOptional({
    description: 'Highlight matching terms in results',
    example: true,
    default: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  highlight?: boolean = false;
}
