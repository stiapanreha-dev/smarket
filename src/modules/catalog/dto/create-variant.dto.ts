import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryPolicy, VariantStatus } from '../../../database/entities/product-variant.entity';

export class CreateVariantDto {
  @ApiProperty({
    description: 'Unique SKU for this variant',
    example: 'WH-PRO-BLK-001',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @ApiPropertyOptional({
    description: 'Variant title (e.g., "Black - Large")',
    example: 'Black - Large',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: 'Price in minor units (cents)',
    example: 19999,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price_minor: number;

  @ApiPropertyOptional({
    description: 'Compare at price in minor units (for discounts)',
    example: 24999,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  compare_at_price_minor?: number;

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
    description: 'Inventory quantity available',
    example: 100,
    default: 0,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  inventory_quantity?: number;

  @ApiPropertyOptional({
    enum: InventoryPolicy,
    description: 'Inventory policy',
    example: InventoryPolicy.DENY,
    default: InventoryPolicy.DENY,
  })
  @IsEnum(InventoryPolicy)
  @IsOptional()
  inventory_policy?: InventoryPolicy;

  @ApiPropertyOptional({
    enum: VariantStatus,
    description: 'Variant status',
    example: VariantStatus.ACTIVE,
    default: VariantStatus.ACTIVE,
  })
  @IsEnum(VariantStatus)
  @IsOptional()
  status?: VariantStatus;

  @ApiPropertyOptional({
    description: 'Variant attributes (color, size, material, etc.)',
    example: {
      color: 'black',
      size: 'L',
      material: 'leather',
    },
  })
  @IsOptional()
  attrs?: {
    size?: string;
    color?: string;
    material?: string;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
    duration?: number;
    capacity?: number;
    access_duration?: number;
    [key: string]: any;
  };

  @ApiPropertyOptional({
    description: 'Variant image URL',
    example: 'https://cdn.example.com/images/product-variant-1.jpg',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  image_url?: string;

  @ApiPropertyOptional({
    description: 'Weight in kg',
    example: 0.5,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({
    description: 'Whether this variant requires shipping',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  requires_shipping?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this variant is taxable',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  taxable?: boolean;

  @ApiPropertyOptional({
    description: 'Barcode (UPC, EAN, etc.)',
    example: '1234567890123',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  barcode?: string;
}
