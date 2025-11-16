import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType, ProductStatus } from '../../../database/entities/product.entity';
import { InventoryPolicy } from '../../../database/entities/product-variant.entity';

export class CreateMerchantVariantDto {
  @ApiProperty({
    description: 'SKU (Stock Keeping Unit)',
    example: 'SKU-12345',
  })
  @IsString()
  sku: string;

  @ApiPropertyOptional({
    description: 'Variant title',
    example: 'Small / Red',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Price in minor units (cents)',
    example: 19999,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price_minor: number;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'USD',
    maxLength: 3,
  })
  @IsString()
  @MaxLength(3)
  currency: string;

  @ApiPropertyOptional({
    description: 'Compare at price in minor units (cents)',
    example: 24999,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  compare_at_price_minor?: number;

  @ApiPropertyOptional({
    description: 'Inventory quantity',
    example: 100,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  inventory_quantity?: number;

  @ApiPropertyOptional({
    description: 'Inventory policy',
    enum: InventoryPolicy,
    example: InventoryPolicy.DENY,
  })
  @IsEnum(InventoryPolicy)
  @IsOptional()
  inventory_policy?: InventoryPolicy;

  @ApiPropertyOptional({
    description: 'Variant attributes',
    example: {
      weight: 150,
      barcode: '1234567890',
      cost_per_item: 10000,
    },
  })
  @IsOptional()
  attrs?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Variant image URL',
    example: 'https://cdn.example.com/images/variant-1.jpg',
  })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional({
    description: 'Requires shipping',
    example: true,
  })
  @IsOptional()
  requires_shipping?: boolean;

  @ApiPropertyOptional({
    description: 'Is taxable',
    example: true,
  })
  @IsOptional()
  taxable?: boolean;
}

export class CreateMerchantProductDto {
  @ApiProperty({
    description: 'Product title',
    example: 'Premium Wireless Headphones',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Short product description (500 chars max)',
    example: 'High-quality wireless headphones with noise cancellation. 15 ml',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  short_description?: string;

  @ApiPropertyOptional({
    description: 'Product description (EditorJS JSON or plain text)',
    example: 'High-quality wireless headphones with noise cancellation',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: ProductType,
    description: 'Product type',
    example: ProductType.PHYSICAL,
  })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiPropertyOptional({
    enum: ProductStatus,
    description: 'Product status',
    example: ProductStatus.DRAFT,
  })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiPropertyOptional({
    description: 'Product attributes (category, tags, etc.)',
    example: {
      category: ['Electronics', 'Audio'],
      tags: ['wireless', 'premium'],
    },
  })
  @IsOptional()
  attrs?: {
    category?: string[];
    tags?: string[];
    [key: string]: any;
  };

  @ApiPropertyOptional({
    description: 'Main product image URL',
    example: 'https://cdn.example.com/images/product-1.jpg',
  })
  @IsString()
  @IsOptional()
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
    maxLength: 3,
  })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Product variants',
    type: [CreateMerchantVariantDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMerchantVariantDto)
  @IsOptional()
  variants?: CreateMerchantVariantDto[];

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
    description: 'URL-friendly slug',
    example: 'premium-wireless-headphones',
  })
  @IsString()
  @IsOptional()
  slug?: string;

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
