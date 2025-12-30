import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product, ProductStatus } from '@database/entities/product.entity';
import { ProductVariant } from '@database/entities/product-variant.entity';
import { ExportProductsDto, EXPORT_COLUMNS } from '../dto/export-products.dto';

const CSV_DELIMITER = ';';

interface ExportRow {
  [key: string]: string | number | null;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
  ) {}

  /**
   * Export products to CSV format
   */
  async exportToCsv(merchantId: string, dto: ExportProductsDto): Promise<string> {
    this.logger.log(`Exporting products for merchant ${merchantId}`);

    // Build query for products
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .where('product.merchant_id = :merchantId', { merchantId });

    // Filter by specific product IDs if provided
    if (dto.product_ids && dto.product_ids.length > 0) {
      queryBuilder.andWhere('product.id IN (:...productIds)', {
        productIds: dto.product_ids,
      });
    }

    // Include deleted products unless explicitly excluded
    if (dto.include_deleted !== false) {
      // Include products with status 'deleted' (soft-deleted)
      // No filter needed as we want all statuses
    } else {
      queryBuilder.andWhere('product.status != :deletedStatus', {
        deletedStatus: ProductStatus.DELETED,
      });
    }

    queryBuilder.orderBy('product.created_at', 'DESC');

    const products = await queryBuilder.getMany();

    if (products.length === 0) {
      this.logger.log('No products found to export');
      return this.generateCsvHeader();
    }

    this.logger.log(`Found ${products.length} products to export`);

    // Generate CSV rows
    const rows = this.generateCsvRows(products, dto.include_variants !== false);

    // Generate CSV content
    const header = this.generateCsvHeader();
    const csvContent = [header, ...rows].join('\n');

    this.logger.log(`Generated CSV with ${rows.length} rows`);

    return csvContent;
  }

  /**
   * Generate CSV header row
   */
  private generateCsvHeader(): string {
    return EXPORT_COLUMNS.map((col) => col.header).join(CSV_DELIMITER);
  }

  /**
   * Generate CSV rows from products
   */
  private generateCsvRows(products: Product[], includeVariants: boolean): string[] {
    const rows: string[] = [];

    for (const product of products) {
      if (includeVariants && product.variants && product.variants.length > 0) {
        // Create a row for each variant
        for (const variant of product.variants) {
          const row = this.productVariantToRow(product, variant);
          rows.push(this.rowToCsvLine(row));
        }
      } else {
        // Create a single row for product without variant data
        const row = this.productToRow(product);
        rows.push(this.rowToCsvLine(row));
      }
    }

    return rows;
  }

  /**
   * Convert product (without variant) to export row
   */
  private productToRow(product: Product): ExportRow {
    return {
      product_id: product.id,
      product_title: product.title,
      product_type: product.type,
      product_status: product.status,
      short_description: product.short_description || '',
      description: product.description || '',
      base_price_minor: product.base_price_minor || '',
      currency: product.currency,
      image_url: product.image_url || '',
      images: product.images ? JSON.stringify(product.images) : '',
      category: product.attrs?.category ? JSON.stringify(product.attrs.category) : '',
      tags: product.attrs?.tags ? JSON.stringify(product.attrs.tags) : '',
      brand: product.attrs?.brand || '',
      weight: product.attrs?.weight || '',
      meta_title: product.seo?.meta_title || '',
      meta_description: product.seo?.meta_description || '',
      keywords: product.seo?.keywords ? JSON.stringify(product.seo.keywords) : '',
      slug: product.slug || '',
      variant_sku: '',
      variant_title: '',
      variant_price_minor: '',
      variant_compare_at_price_minor: '',
      variant_inventory_quantity: '',
      variant_inventory_policy: '',
      variant_barcode: '',
      variant_weight: '',
      variant_requires_shipping: '',
      variant_taxable: '',
      variant_attrs: '',
    };
  }

  /**
   * Convert product with variant to export row
   */
  private productVariantToRow(product: Product, variant: ProductVariant): ExportRow {
    return {
      product_id: product.id,
      product_title: product.title,
      product_type: product.type,
      product_status: product.status,
      short_description: product.short_description || '',
      description: product.description || '',
      base_price_minor: product.base_price_minor || '',
      currency: product.currency,
      image_url: product.image_url || '',
      images: product.images ? JSON.stringify(product.images) : '',
      category: product.attrs?.category ? JSON.stringify(product.attrs.category) : '',
      tags: product.attrs?.tags ? JSON.stringify(product.attrs.tags) : '',
      brand: product.attrs?.brand || '',
      weight: product.attrs?.weight || '',
      meta_title: product.seo?.meta_title || '',
      meta_description: product.seo?.meta_description || '',
      keywords: product.seo?.keywords ? JSON.stringify(product.seo.keywords) : '',
      slug: product.slug || '',
      variant_sku: variant.sku,
      variant_title: variant.title || '',
      variant_price_minor: variant.price_minor,
      variant_compare_at_price_minor: variant.compare_at_price_minor || '',
      variant_inventory_quantity: variant.inventory_quantity,
      variant_inventory_policy: variant.inventory_policy,
      variant_barcode: variant.barcode || '',
      variant_weight: variant.weight || '',
      variant_requires_shipping: variant.requires_shipping ? 'true' : 'false',
      variant_taxable: variant.taxable ? 'true' : 'false',
      variant_attrs: variant.attrs ? JSON.stringify(variant.attrs) : '',
    };
  }

  /**
   * Convert row object to CSV line
   */
  private rowToCsvLine(row: ExportRow): string {
    return EXPORT_COLUMNS.map((col) => {
      const value = row[col.key];
      return this.escapeCsvValue(value);
    }).join(CSV_DELIMITER);
  }

  /**
   * Escape CSV value for semicolon-separated format
   */
  private escapeCsvValue(value: string | number | null): string {
    if (value === null || value === undefined) {
      return '';
    }

    const strValue = String(value);

    // Escape quotes and wrap in quotes if contains delimiter, quotes, or newlines
    if (
      strValue.includes(CSV_DELIMITER) ||
      strValue.includes('"') ||
      strValue.includes('\n') ||
      strValue.includes('\r')
    ) {
      return `"${strValue.replace(/"/g, '""')}"`;
    }

    return strValue;
  }
}
