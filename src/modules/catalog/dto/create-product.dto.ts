import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '../../../database/entities/product.entity';
import { ProductTranslationDto } from './product-translation.dto';
import { CreateVariantDto } from './create-variant.dto';

export class CreateProductDto {
  @ApiProperty({
    enum: ProductType,
    description: 'Product type',
    example: ProductType.PHYSICAL,
  })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiProperty({
    description: 'Product translations (must include all 3 locales: en, ru, ar)',
    type: [ProductTranslationDto],
    minItems: 3,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductTranslationDto)
  @ArrayMinSize(3, { message: 'Translations for all 3 locales (en, ru, ar) are required' })
  translations: ProductTranslationDto[];

  @ApiPropertyOptional({
    description: 'Base price in minor units (cents)',
    example: 19999,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  base_price_minor?: number;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'USD',
    default: 'USD',
    maxLength: 3,
  })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Product variants (if not provided, default variant will be created)',
    type: [CreateVariantDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  @IsOptional()
  variants?: CreateVariantDto[];

  @ApiPropertyOptional({
    description: 'Product attributes (brand, color, size, tags, etc.)',
    example: {
      brand: 'TechBrand',
      tags: ['electronics', 'audio', 'premium'],
      category: ['Electronics', 'Audio', 'Headphones'],
    },
  })
  @IsOptional()
  attrs?: {
    brand?: string;
    color?: string;
    size?: string;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
    category?: string[];
    tags?: string[];
    [key: string]: any;
  };

  @ApiPropertyOptional({
    description: 'Main product image URL',
    example: 'https://cdn.example.com/images/product-1.jpg',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  image_url?: string;

  @ApiPropertyOptional({
    description: 'Additional product images',
    example: [
      'https://cdn.example.com/images/product-1-1.jpg',
      'https://cdn.example.com/images/product-1-2.jpg',
    ],
  })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({
    description: 'SEO metadata',
    example: {
      meta_title: 'Premium Wireless Headphones | TechBrand',
      meta_description: 'Buy the best wireless headphones with noise cancellation',
      keywords: ['headphones', 'wireless', 'premium', 'audio'],
    },
  })
  @IsOptional()
  seo?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  };

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: {
      supplier_id: '123',
      warranty_period: '24 months',
    },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
