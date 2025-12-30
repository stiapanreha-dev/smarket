import { IsArray, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExportProductsDto {
  @ApiPropertyOptional({
    description: 'Product IDs to export. If empty, exports all products.',
    type: [String],
    example: ['uuid1', 'uuid2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  product_ids?: string[];

  @ApiPropertyOptional({
    description: 'Include soft-deleted products',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  include_deleted?: boolean;

  @ApiPropertyOptional({
    description: 'Include product variants',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  include_variants?: boolean;
}

export interface ExportColumn {
  key: string;
  header: string;
}

export const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'product_id', header: 'product_id' },
  { key: 'product_title', header: 'product_title' },
  { key: 'product_type', header: 'product_type' },
  { key: 'product_status', header: 'product_status' },
  { key: 'short_description', header: 'short_description' },
  { key: 'description', header: 'description' },
  { key: 'base_price_minor', header: 'base_price_minor' },
  { key: 'currency', header: 'currency' },
  { key: 'image_url', header: 'image_url' },
  { key: 'images', header: 'images' },
  { key: 'category', header: 'category' },
  { key: 'tags', header: 'tags' },
  { key: 'brand', header: 'brand' },
  { key: 'weight', header: 'weight' },
  { key: 'meta_title', header: 'meta_title' },
  { key: 'meta_description', header: 'meta_description' },
  { key: 'keywords', header: 'keywords' },
  { key: 'slug', header: 'slug' },
  { key: 'variant_sku', header: 'variant_sku' },
  { key: 'variant_title', header: 'variant_title' },
  { key: 'variant_price_minor', header: 'variant_price_minor' },
  { key: 'variant_compare_at_price_minor', header: 'variant_compare_at_price_minor' },
  { key: 'variant_inventory_quantity', header: 'variant_inventory_quantity' },
  { key: 'variant_inventory_policy', header: 'variant_inventory_policy' },
  { key: 'variant_barcode', header: 'variant_barcode' },
  { key: 'variant_weight', header: 'variant_weight' },
  { key: 'variant_requires_shipping', header: 'variant_requires_shipping' },
  { key: 'variant_taxable', header: 'variant_taxable' },
  { key: 'variant_attrs', header: 'variant_attrs' },
];
