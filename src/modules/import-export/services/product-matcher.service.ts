import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from '@database/entities/product.entity';
import { ProductVariant } from '@database/entities/product-variant.entity';
import {
  ImportItem,
  ImportItemStatus,
  ImportItemAction,
  MatchMethod,
  FieldChange,
} from '@database/entities/import-item.entity';
import { ImportSession, ImportSessionStatus } from '@database/entities/import-session.entity';

export interface MatchResult {
  item_id: string;
  matched: boolean;
  matched_product_id?: string;
  matched_variant_id?: string;
  matched_by?: MatchMethod;
  match_confidence: number;
  changes?: FieldChange[];
}

@Injectable()
export class ProductMatcherService {
  private readonly logger = new Logger(ProductMatcherService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(ImportItem)
    private readonly itemRepository: Repository<ImportItem>,
    @InjectRepository(ImportSession)
    private readonly sessionRepository: Repository<ImportSession>,
  ) {}

  /**
   * Match import items to existing products
   */
  async matchItems(sessionId: string, merchantId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, merchant_id: merchantId },
    });

    if (!session) {
      throw new Error('Import session not found');
    }

    if (session.status !== ImportSessionStatus.ANALYZED) {
      throw new Error(`Cannot match items in status: ${session.status}`);
    }

    // Update session status
    session.status = ImportSessionStatus.RECONCILING;
    await this.sessionRepository.save(session);

    try {
      // Get all import items
      const items = await this.itemRepository.find({
        where: { session_id: sessionId },
      });

      this.logger.log(`Matching ${items.length} items for session ${sessionId}`);

      // Get existing products for merchant
      const existingProducts = await this.productRepository.find({
        where: { merchant_id: merchantId },
        relations: ['variants'],
      });

      // Build lookup maps
      const productsById = new Map<string, Product>();
      const productsByTitle = new Map<string, Product>();
      const variantsBySku = new Map<string, { product: Product; variant: ProductVariant }>();
      const variantsByBarcode = new Map<string, { product: Product; variant: ProductVariant }>();

      for (const product of existingProducts) {
        // Map by ID (highest priority for our export format)
        productsById.set(product.id, product);

        // Map by title (lowercase for case-insensitive matching)
        if (product.title) {
          productsByTitle.set(product.title.toLowerCase(), product);
        }

        // Map variants by SKU and barcode
        if (product.variants) {
          for (const variant of product.variants) {
            if (variant.sku) {
              variantsBySku.set(variant.sku.toLowerCase(), { product, variant });
            }
            if (variant.barcode) {
              variantsByBarcode.set(variant.barcode.toLowerCase(), { product, variant });
            }
          }
        }
      }

      this.logger.log(
        `Loaded ${existingProducts.length} products, ${variantsBySku.size} SKUs, ${variantsByBarcode.size} barcodes`,
      );

      // Match items in batches
      const batchSize = 100;
      let matchedCount = 0;
      let newCount = 0;
      let conflictCount = 0;

      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);

        for (const item of batch) {
          const result = this.matchItem(
            item,
            productsById,
            productsByTitle,
            variantsBySku,
            variantsByBarcode,
          );

          if (result.matched) {
            item.matched_product_id = result.matched_product_id;
            item.matched_variant_id = result.matched_variant_id;
            item.matched_by = result.matched_by;
            item.match_confidence = result.match_confidence;
            item.changes = result.changes;
            item.status = ImportItemStatus.MATCHED;
            item.action = ImportItemAction.UPDATE;
            matchedCount++;

            // Check for conflicts (different prices, etc.)
            if (this.hasSignificantChanges(result.changes)) {
              item.status = ImportItemStatus.CONFLICT;
              conflictCount++;
              matchedCount--;
            }
          } else {
            item.status = ImportItemStatus.NEW;
            item.action = ImportItemAction.INSERT;
            newCount++;
          }
        }

        await this.itemRepository.save(batch);
      }

      this.logger.log(
        `Matching complete: ${matchedCount} matched, ${newCount} new, ${conflictCount} conflicts`,
      );

      // Keep session in reconciling status for user review
      await this.sessionRepository.save(session);
    } catch (error) {
      session.status = ImportSessionStatus.FAILED;
      session.error_message = (error as Error).message;
      await this.sessionRepository.save(session);
      throw error;
    }
  }

  /**
   * Match single item to existing products
   */
  private matchItem(
    item: ImportItem,
    productsById: Map<string, Product>,
    productsByTitle: Map<string, Product>,
    variantsBySku: Map<string, { product: Product; variant: ProductVariant }>,
    variantsByBarcode: Map<string, { product: Product; variant: ProductVariant }>,
  ): MatchResult {
    const mappedData = item.mapped_data;
    if (!mappedData) {
      return { item_id: item.id, matched: false, match_confidence: 0 };
    }

    // Priority 0: Match by product ID (highest confidence - our export format)
    const productId = mappedData.product?.id;
    if (productId) {
      const idMatch = productsById.get(productId);
      if (idMatch) {
        // Find first variant for the product
        const variant = idMatch.variants?.[0] || null;
        const changes = this.detectChanges(mappedData, idMatch, variant);
        return {
          item_id: item.id,
          matched: true,
          matched_product_id: idMatch.id,
          matched_variant_id: variant?.id,
          matched_by: MatchMethod.SKU, // Use SKU as closest match type
          match_confidence: 1.0,
          changes,
        };
      }
    }

    // Priority 1: Match by SKU
    const sku = mappedData.variant?.sku;
    if (sku) {
      const skuMatch = variantsBySku.get(sku.toLowerCase());
      if (skuMatch) {
        const changes = this.detectChanges(mappedData, skuMatch.product, skuMatch.variant);
        return {
          item_id: item.id,
          matched: true,
          matched_product_id: skuMatch.product.id,
          matched_variant_id: skuMatch.variant.id,
          matched_by: MatchMethod.SKU,
          match_confidence: 1.0,
          changes,
        };
      }
    }

    // Priority 2: Match by barcode
    const barcode = mappedData.variant?.barcode;
    if (barcode) {
      const barcodeMatch = variantsByBarcode.get(barcode.toLowerCase());
      if (barcodeMatch) {
        const changes = this.detectChanges(mappedData, barcodeMatch.product, barcodeMatch.variant);
        return {
          item_id: item.id,
          matched: true,
          matched_product_id: barcodeMatch.product.id,
          matched_variant_id: barcodeMatch.variant.id,
          matched_by: MatchMethod.BARCODE,
          match_confidence: 0.95,
          changes,
        };
      }
    }

    // Priority 3: Match by exact title
    const title = mappedData.product?.title;
    if (title) {
      const titleMatch = productsByTitle.get(title.toLowerCase());
      if (titleMatch) {
        const changes = this.detectChanges(mappedData, titleMatch, null);
        return {
          item_id: item.id,
          matched: true,
          matched_product_id: titleMatch.id,
          matched_by: MatchMethod.TITLE,
          match_confidence: 0.7,
          changes,
        };
      }
    }

    // No match found
    return { item_id: item.id, matched: false, match_confidence: 0 };
  }

  /**
   * Detect changes between import data and existing product
   */
  private detectChanges(
    mappedData: { product: Record<string, any>; variant: Record<string, any> },
    existingProduct: Product,
    existingVariant: ProductVariant | null,
  ): FieldChange[] {
    const changes: FieldChange[] = [];

    // Product field comparisons
    const productFields: Array<[keyof Product, string]> = [
      ['title', 'product.title'],
      ['short_description', 'product.short_description'],
      ['description', 'product.description'],
      ['base_price_minor', 'product.base_price_minor'],
      ['image_url', 'product.image_url'],
    ];

    for (const [entityField, dataPath] of productFields) {
      const newValue = mappedData.product?.[entityField.replace('product.', '')];
      const oldValue = existingProduct[entityField];

      if (newValue !== undefined && newValue !== '' && newValue !== oldValue) {
        changes.push({
          field: dataPath,
          old_value: this.toFieldValue(oldValue),
          new_value: this.toFieldValue(newValue),
        });
      }
    }

    // Variant field comparisons
    if (existingVariant) {
      const variantFields: Array<[keyof ProductVariant, string]> = [
        ['title', 'variant.title'],
        ['price_minor', 'variant.price_minor'],
        ['compare_at_price_minor', 'variant.compare_at_price_minor'],
        ['inventory_quantity', 'variant.inventory_quantity'],
      ];

      for (const [entityField, dataPath] of variantFields) {
        const newValue = mappedData.variant?.[entityField.replace('variant.', '')];
        const oldValue = existingVariant[entityField];

        if (newValue !== undefined && newValue !== '' && newValue !== oldValue) {
          changes.push({
            field: dataPath,
            old_value: this.toFieldValue(oldValue),
            new_value: this.toFieldValue(newValue),
          });
        }
      }
    }

    return changes;
  }

  /**
   * Convert value to FieldChange compatible type
   */
  private toFieldValue(value: unknown): string | number | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Check if changes are significant (warrant conflict status)
   */
  private hasSignificantChanges(changes?: FieldChange[]): boolean {
    if (!changes || changes.length === 0) return false;

    // Significant changes: price decreases more than 10%, title changes
    for (const change of changes) {
      if (change.field === 'product.title' && change.old_value && change.new_value) {
        // Title changed significantly
        const similarity = this.calculateStringSimilarity(
          String(change.old_value),
          String(change.new_value),
        );
        if (similarity < 0.8) return true;
      }

      if (change.field === 'product.base_price_minor' || change.field === 'variant.price_minor') {
        const oldPrice = Number(change.old_value) || 0;
        const newPrice = Number(change.new_value) || 0;

        // Price decrease more than 20%
        if (oldPrice > 0 && newPrice < oldPrice * 0.8) return true;

        // Price increase more than 50%
        if (oldPrice > 0 && newPrice > oldPrice * 1.5) return true;
      }
    }

    return false;
  }

  /**
   * Calculate string similarity (Jaccard index)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Get match statistics for session
   */
  async getMatchStats(sessionId: string): Promise<{
    total: number;
    matched: number;
    new: number;
    conflicts: number;
    errors: number;
    pending: number;
  }> {
    const items = await this.itemRepository.find({
      where: { session_id: sessionId },
      select: ['status'],
    });

    const stats = {
      total: items.length,
      matched: 0,
      new: 0,
      conflicts: 0,
      errors: 0,
      pending: 0,
    };

    for (const item of items) {
      switch (item.status) {
        case ImportItemStatus.MATCHED:
        case ImportItemStatus.APPROVED:
        case ImportItemStatus.IMPORTED:
          stats.matched++;
          break;
        case ImportItemStatus.NEW:
          stats.new++;
          break;
        case ImportItemStatus.CONFLICT:
          stats.conflicts++;
          break;
        case ImportItemStatus.ERROR:
          stats.errors++;
          break;
        case ImportItemStatus.PENDING:
          stats.pending++;
          break;
      }
    }

    return stats;
  }

  /**
   * Resolve conflict by choosing action
   */
  async resolveConflict(
    itemId: string,
    sessionId: string,
    action: 'update' | 'skip' | 'insert',
  ): Promise<ImportItem> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId, session_id: sessionId },
    });

    if (!item) {
      throw new Error('Import item not found');
    }

    switch (action) {
      case 'update':
        item.status = ImportItemStatus.APPROVED;
        item.action = ImportItemAction.UPDATE;
        break;
      case 'skip':
        item.status = ImportItemStatus.REJECTED;
        item.action = ImportItemAction.SKIP;
        break;
      case 'insert':
        // Create as new product instead of updating
        item.status = ImportItemStatus.APPROVED;
        item.action = ImportItemAction.INSERT;
        item.matched_product_id = undefined;
        item.matched_variant_id = undefined;
        break;
    }

    return this.itemRepository.save(item);
  }
}
