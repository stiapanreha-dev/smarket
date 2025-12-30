import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import {
  ImportSession,
  ImportSessionStatus,
  ImportFileFormat,
} from '@database/entities/import-session.entity';
import {
  ImportItem,
  ImportItemStatus,
  ImportItemAction,
} from '@database/entities/import-item.entity';
import { Product } from '@database/entities/product.entity';
import { ProductVariant } from '@database/entities/product-variant.entity';
import { FileParserService } from './file-parser.service';
import { RawImportRow } from '../parsers/base-parser.interface';
import { UpdateImportItemDto, ApproveAllItemsDto } from '../dto/update-import-item.dto';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    @InjectRepository(ImportSession)
    private readonly sessionRepository: Repository<ImportSession>,
    @InjectRepository(ImportItem)
    private readonly itemRepository: Repository<ImportItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    private readonly fileParserService: FileParserService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Upload and parse import file
   */
  async uploadAndParse(
    merchantId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<ImportSession> {
    this.logger.log(`Processing upload for merchant ${merchantId}: ${file.originalname}`);

    // Detect file format
    const fileFormat = this.fileParserService.detectFileFormat(file.originalname);

    // Create session
    const session = this.sessionRepository.create({
      merchant_id: merchantId,
      user_id: userId,
      original_filename: file.originalname,
      file_format: fileFormat,
      status: ImportSessionStatus.PARSING,
    });

    await this.sessionRepository.save(session);

    try {
      // Parse file
      const parseResult = await this.fileParserService.parseFile(file.buffer, file.originalname);

      // Create import items for each row
      const items: ImportItem[] = [];
      for (let i = 0; i < parseResult.rows.length; i++) {
        const item = this.itemRepository.create({
          session_id: session.id,
          row_number: i + 1,
          raw_data: parseResult.rows[i],
          status: ImportItemStatus.PENDING,
          action: ImportItemAction.INSERT,
        });
        items.push(item);
      }

      // Save items in batches
      const batchSize = 100;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await this.itemRepository.save(batch);
      }

      // Update session
      session.status = ImportSessionStatus.PARSED;
      session.total_rows = parseResult.rows.length;
      session.analysis_result = {
        detected_columns: parseResult.columns,
        column_mapping: [],
        suggestions: [],
        warnings: [],
        sample_data: parseResult.rows.slice(0, 5),
      };

      await this.sessionRepository.save(session);

      this.logger.log(`Upload complete: session ${session.id}, ${parseResult.rows.length} rows`);

      return session;
    } catch (error) {
      // Update session with error
      session.status = ImportSessionStatus.FAILED;
      session.error_message = (error as Error).message;
      await this.sessionRepository.save(session);

      throw error;
    }
  }

  /**
   * Get import session by ID
   */
  async getSession(sessionId: string, merchantId: string): Promise<ImportSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, merchant_id: merchantId },
    });

    if (!session) {
      throw new NotFoundException('Import session not found');
    }

    return session;
  }

  /**
   * Get import items with pagination
   */
  async getItems(
    sessionId: string,
    merchantId: string,
    page: number = 1,
    limit: number = 50,
    status?: ImportItemStatus,
  ): Promise<{
    items: ImportItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Verify session belongs to merchant
    await this.getSession(sessionId, merchantId);

    const skip = (page - 1) * limit;

    const queryBuilder = this.itemRepository
      .createQueryBuilder('item')
      .where('item.session_id = :sessionId', { sessionId });

    if (status) {
      queryBuilder.andWhere('item.status = :status', { status });
    }

    queryBuilder.orderBy('item.row_number', 'ASC');

    const [items, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update import item
   */
  async updateItem(
    sessionId: string,
    itemId: string,
    merchantId: string,
    dto: UpdateImportItemDto,
  ): Promise<ImportItem> {
    // Verify session belongs to merchant
    await this.getSession(sessionId, merchantId);

    const item = await this.itemRepository.findOne({
      where: { id: itemId, session_id: sessionId },
    });

    if (!item) {
      throw new NotFoundException('Import item not found');
    }

    // Update fields
    if (dto.status !== undefined) {
      item.status = dto.status;
    }

    if (dto.action !== undefined) {
      item.action = dto.action;
    }

    if (dto.matched_product_id !== undefined) {
      item.matched_product_id = dto.matched_product_id;
    }

    if (dto.matched_variant_id !== undefined) {
      item.matched_variant_id = dto.matched_variant_id;
    }

    if (dto.mapped_data !== undefined) {
      item.mapped_data = dto.mapped_data;
    }

    await this.itemRepository.save(item);

    return item;
  }

  /**
   * Approve all items
   */
  async approveAll(
    sessionId: string,
    merchantId: string,
    dto: ApproveAllItemsDto,
  ): Promise<{ approved: number }> {
    // Verify session belongs to merchant
    await this.getSession(sessionId, merchantId);

    const queryBuilder = this.itemRepository
      .createQueryBuilder()
      .update(ImportItem)
      .set({ status: ImportItemStatus.APPROVED })
      .where('session_id = :sessionId', { sessionId });

    // Filter by statuses if specified
    if (dto.statuses && dto.statuses.length > 0) {
      queryBuilder.andWhere('status IN (:...statuses)', {
        statuses: dto.statuses,
      });
    } else {
      // By default, approve pending, matched, new items
      queryBuilder.andWhere('status IN (:...statuses)', {
        statuses: [ImportItemStatus.PENDING, ImportItemStatus.MATCHED, ImportItemStatus.NEW],
      });
    }

    const result = await queryBuilder.execute();

    return { approved: result.affected || 0 };
  }

  /**
   * Cancel import session
   */
  async cancelSession(sessionId: string, merchantId: string): Promise<ImportSession> {
    const session = await this.getSession(sessionId, merchantId);

    if (session.status === ImportSessionStatus.EXECUTING) {
      throw new BadRequestException('Cannot cancel session while executing');
    }

    session.status = ImportSessionStatus.CANCELLED;
    await this.sessionRepository.save(session);

    return session;
  }

  /**
   * Execute import - create/update products
   */
  async executeImport(sessionId: string, merchantId: string): Promise<ImportSession> {
    const session = await this.getSession(sessionId, merchantId);

    if (
      session.status !== ImportSessionStatus.ANALYZED &&
      session.status !== ImportSessionStatus.RECONCILING
    ) {
      throw new BadRequestException(`Cannot execute import in status: ${session.status}`);
    }

    // Update session status
    session.status = ImportSessionStatus.EXECUTING;
    await this.sessionRepository.save(session);

    try {
      // Get approved items
      const approvedItems = await this.itemRepository.find({
        where: {
          session_id: sessionId,
          status: ImportItemStatus.APPROVED,
        },
        order: { row_number: 'ASC' },
      });

      let successCount = 0;
      let errorCount = 0;
      let newCount = 0;
      let updateCount = 0;
      let skipCount = 0;

      // Process items in transaction
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        for (const item of approvedItems) {
          try {
            if (item.action === ImportItemAction.SKIP) {
              skipCount++;
              item.status = ImportItemStatus.IMPORTED;
              continue;
            }

            if (item.action === ImportItemAction.INSERT) {
              // Create new product/variant
              const result = await this.createProductFromItem(
                item,
                merchantId,
                queryRunner.manager,
              );
              item.created_product_id = result.productId;
              item.created_variant_id = result.variantId;
              item.status = ImportItemStatus.IMPORTED;
              newCount++;
              successCount++;
            } else if (item.action === ImportItemAction.UPDATE) {
              // Update existing product/variant
              await this.updateProductFromItem(item, queryRunner.manager);
              item.status = ImportItemStatus.IMPORTED;
              updateCount++;
              successCount++;
            }
          } catch (error) {
            item.status = ImportItemStatus.ERROR;
            item.error_message = (error as Error).message;
            errorCount++;
          }

          await queryRunner.manager.save(item);
          session.processed_rows++;
        }

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }

      // Update session
      session.status = ImportSessionStatus.COMPLETED;
      session.success_count = successCount;
      session.error_count = errorCount;
      session.new_count = newCount;
      session.update_count = updateCount;
      session.skip_count = skipCount;
      session.completed_at = new Date();

      await this.sessionRepository.save(session);

      this.logger.log(`Import complete: ${successCount} success, ${errorCount} errors`);

      return session;
    } catch (error) {
      session.status = ImportSessionStatus.FAILED;
      session.error_message = (error as Error).message;
      await this.sessionRepository.save(session);

      throw error;
    }
  }

  /**
   * Create product from import item
   */
  private async createProductFromItem(
    item: ImportItem,
    merchantId: string,
    manager: any,
  ): Promise<{ productId: string; variantId: string | null }> {
    if (!item.mapped_data) {
      throw new Error('Mapped data is required');
    }

    const productData = item.mapped_data.product;
    const variantData = item.mapped_data.variant;

    // Create product
    const product = manager.create(Product, {
      merchant_id: merchantId,
      title: productData.title || 'Untitled Product',
      short_description: productData.short_description,
      description: productData.description,
      type: productData.type || 'PHYSICAL',
      status: productData.status || 'draft',
      base_price_minor: productData.base_price_minor,
      currency: productData.currency || 'USD',
      image_url: productData.image_url,
      images: productData.images,
      slug: productData.slug,
      attrs: {
        category: productData.category,
        tags: productData.tags,
        brand: productData.brand,
        weight: productData.weight,
      },
      seo: productData.seo,
    });

    const savedProduct = await manager.save(product);

    // Create variant if SKU provided
    let variantId: string | null = null;
    if (variantData?.sku) {
      const variant = manager.create(ProductVariant, {
        product_id: savedProduct.id,
        sku: variantData.sku,
        title: variantData.title,
        price_minor: variantData.price_minor || productData.base_price_minor || 0,
        currency: variantData.currency || productData.currency || 'USD',
        compare_at_price_minor: variantData.compare_at_price_minor,
        inventory_quantity: variantData.inventory_quantity || 0,
        inventory_policy: variantData.inventory_policy || 'deny',
        barcode: variantData.barcode,
        weight: variantData.weight,
        requires_shipping: variantData.requires_shipping ?? true,
        taxable: variantData.taxable ?? true,
        attrs: variantData.attrs,
      });

      const savedVariant = await manager.save(variant);
      variantId = savedVariant.id;
    }

    return { productId: savedProduct.id, variantId };
  }

  /**
   * Update product from import item
   */
  private async updateProductFromItem(item: ImportItem, manager: any): Promise<void> {
    if (!item.mapped_data || !item.matched_product_id) {
      throw new Error('Mapped data and matched product ID are required');
    }

    const productData = item.mapped_data.product;
    const variantData = item.mapped_data.variant;

    // Update product
    const updateData: any = {};

    if (productData.title) updateData.title = productData.title;
    if (productData.short_description !== undefined)
      updateData.short_description = productData.short_description;
    if (productData.description !== undefined) updateData.description = productData.description;
    if (productData.base_price_minor !== undefined)
      updateData.base_price_minor = productData.base_price_minor;
    if (productData.image_url !== undefined) updateData.image_url = productData.image_url;
    if (productData.images !== undefined) updateData.images = productData.images;

    if (Object.keys(updateData).length > 0) {
      await manager.update(Product, item.matched_product_id, updateData);
    }

    // Update variant if matched
    if (item.matched_variant_id && variantData) {
      const variantUpdate: any = {};

      if (variantData.title !== undefined) variantUpdate.title = variantData.title;
      if (variantData.price_minor !== undefined)
        variantUpdate.price_minor = variantData.price_minor;
      if (variantData.compare_at_price_minor !== undefined)
        variantUpdate.compare_at_price_minor = variantData.compare_at_price_minor;
      if (variantData.inventory_quantity !== undefined)
        variantUpdate.inventory_quantity = variantData.inventory_quantity;

      if (Object.keys(variantUpdate).length > 0) {
        await manager.update(ProductVariant, item.matched_variant_id, variantUpdate);
      }
    }
  }
}
