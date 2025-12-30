import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { Product, ProductStatus } from '../../database/entities/product.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import {
  ProductTranslation,
  TranslationLocale,
} from '../../database/entities/product-translation.entity';
import { ProductImage } from '../../database/entities/product-image.entity';
import { AuditLogService } from '../../common/services/audit-log.service';
import { AuditAction } from '../../database/entities/audit-log.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductTranslation)
    private readonly translationRepository: Repository<ProductTranslation>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Create a new product
   */
  async createProduct(
    merchantId: string,
    createProductDto: CreateProductDto,
    userId: string,
  ): Promise<Product> {
    // Validate that all required locales are present
    const requiredLocales = ['en', 'ru', 'ar'];
    const providedLocales = createProductDto.translations.map((t) => t.locale);
    const missingLocales = requiredLocales.filter((l) => !providedLocales.includes(l as any));

    if (missingLocales.length > 0) {
      throw new BadRequestException(
        `Missing translations for locales: ${missingLocales.join(', ')}`,
      );
    }

    // Create product
    const product = this.productRepository.create({
      merchant_id: merchantId,
      type: createProductDto.type,
      base_price_minor: createProductDto.base_price_minor,
      currency: createProductDto.currency || 'USD',
      attrs: createProductDto.attrs,
      image_url: createProductDto.image_url,
      images: createProductDto.images,
      seo: createProductDto.seo,
      metadata: createProductDto.metadata,
      status: ProductStatus.DRAFT,
    });

    // Generate slugs for translations
    const translations = await Promise.all(
      createProductDto.translations.map(async (translationDto) => {
        const slug =
          translationDto.slug ||
          (await this.generateUniqueSlug(translationDto.title, translationDto.locale));

        return this.translationRepository.create({
          ...translationDto,
          slug,
        });
      }),
    );

    product.translations = translations;

    // Handle variants
    if (createProductDto.variants?.length) {
      // Validate SKU uniqueness
      const skus = createProductDto.variants.map((v) => v.sku);
      const duplicateSku = skus.find((sku, index) => skus.indexOf(sku) !== index);
      if (duplicateSku) {
        throw new BadRequestException(`Duplicate SKU found: ${duplicateSku}`);
      }

      // Check if SKUs already exist
      const existingVariants = await this.variantRepository.find({
        where: { sku: In(skus) },
      });
      if (existingVariants.length > 0) {
        throw new BadRequestException(
          `SKU already exists: ${existingVariants.map((v) => v.sku).join(', ')}`,
        );
      }

      product.variants = createProductDto.variants.map((variantDto) =>
        this.variantRepository.create(variantDto),
      );
    } else {
      // Create default variant
      const defaultSku = this.generateSku();
      product.variants = [
        this.variantRepository.create({
          sku: defaultSku,
          price_minor: createProductDto.base_price_minor || 0,
          currency: createProductDto.currency || 'USD',
          inventory_quantity: 0,
        }),
      ];
    }

    // Save product with all relations
    const savedProduct = await this.productRepository.save(product);

    this.logger.log(`Product created: ${savedProduct.id} by merchant ${merchantId}`);

    // Create audit log
    await this.auditLogService.createLog({
      userId,
      action: AuditAction.CREATE,
      description: `Created product: ${translations[0].title}`,
      newValues: {
        productId: savedProduct.id,
        type: savedProduct.type,
        merchantId,
      },
    });

    return this.findOneById(savedProduct.id);
  }

  /**
   * Find product by ID
   */
  async findOneById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['translations', 'variants', 'product_images', 'merchant'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  /**
   * Find product by slug
   */
  async findOneBySlug(slug: string, locale: string = 'en'): Promise<Product> {
    const translation = await this.translationRepository.findOne({
      where: { slug, locale: locale as TranslationLocale },
      relations: ['product', 'product.translations', 'product.variants', 'product.product_images'],
    });

    if (!translation || !translation.product) {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }

    return translation.product;
  }

  /**
   * Find product by ID or slug (flexible lookup)
   * First tries to parse as UUID, if fails - treats as slug
   */
  async findOneByIdOrSlug(idOrSlug: string, locale: string = 'en'): Promise<Product> {
    // Check if it's a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(idOrSlug)) {
      // It's a UUID - find by ID
      return this.findOneById(idOrSlug);
    }

    // It's a slug - find by slug
    return this.findOneBySlug(idOrSlug, locale);
  }

  /**
   * Update product
   */
  async updateProduct(
    productId: string,
    merchantId: string,
    updateProductDto: UpdateProductDto,
    userId: string,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId, merchant_id: merchantId },
      relations: ['translations', 'variants', 'product_images'],
    });

    if (!product) {
      throw new NotFoundException('Product not found or you do not have permission to update it');
    }

    const oldValues = { ...product };

    // Update basic fields
    if (updateProductDto.type !== undefined) product.type = updateProductDto.type;
    if (updateProductDto.status !== undefined) product.status = updateProductDto.status;
    if (updateProductDto.base_price_minor !== undefined)
      product.base_price_minor = updateProductDto.base_price_minor;
    if (updateProductDto.currency !== undefined) product.currency = updateProductDto.currency;
    if (updateProductDto.attrs !== undefined) product.attrs = updateProductDto.attrs;
    if (updateProductDto.image_url !== undefined) product.image_url = updateProductDto.image_url;
    if (updateProductDto.images !== undefined) product.images = updateProductDto.images;
    if (updateProductDto.seo !== undefined) product.seo = updateProductDto.seo;
    if (updateProductDto.metadata !== undefined) product.metadata = updateProductDto.metadata;

    // Handle translations
    if (updateProductDto.translations) {
      for (const translationDto of updateProductDto.translations) {
        const existing = product.translations.find((t) => t.locale === translationDto.locale);

        if (existing) {
          // Update existing translation
          existing.title = translationDto.title;
          existing.description = translationDto.description ?? null;
          existing.attrs = translationDto.attrs ?? null;

          // Update slug if provided or if title changed
          if (translationDto.slug) {
            existing.slug = translationDto.slug;
          } else if (existing.title !== translationDto.title) {
            existing.slug = await this.generateUniqueSlug(
              translationDto.title,
              translationDto.locale,
            );
          }

          await this.translationRepository.save(existing);
        } else {
          // Create new translation
          const slug =
            translationDto.slug ||
            (await this.generateUniqueSlug(translationDto.title, translationDto.locale));

          const newTranslation = this.translationRepository.create({
            ...translationDto,
            slug,
            product_id: product.id,
          });

          await this.translationRepository.save(newTranslation);
        }
      }
    }

    // Save updated product
    const updatedProduct = await this.productRepository.save(product);

    this.logger.log(`Product updated: ${updatedProduct.id} by user ${userId}`);

    // Create audit log for significant changes
    if (
      oldValues.status !== updatedProduct.status ||
      oldValues.base_price_minor !== updatedProduct.base_price_minor
    ) {
      await this.auditLogService.createLog({
        userId,
        action: AuditAction.UPDATE,
        description: `Updated product: ${product.id}`,
        oldValues: {
          status: oldValues.status,
          basePrice: oldValues.base_price_minor,
        },
        newValues: {
          status: updatedProduct.status,
          basePrice: updatedProduct.base_price_minor,
        },
      });
    }

    return this.findOneById(updatedProduct.id);
  }

  /**
   * Soft delete product
   */
  async deleteProduct(productId: string, merchantId: string, userId: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id: productId, merchant_id: merchantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found or you do not have permission to delete it');
    }

    // TODO: Check for active orders (implement when order module is ready)
    // const hasActiveOrders = await this.checkActiveOrders(productId);
    // if (hasActiveOrders) {
    //   throw new BadRequestException('Cannot delete product with active orders');
    // }

    // Soft delete
    product.status = ProductStatus.DELETED;
    await this.productRepository.save(product);

    this.logger.log(`Product soft deleted: ${productId} by user ${userId}`);

    // Create audit log
    await this.auditLogService.createLog({
      userId,
      action: AuditAction.DELETE,
      description: `Deleted product: ${productId}`,
      oldValues: { productId, merchantId },
    });
  }

  /**
   * Search and filter products
   */
  async searchProducts(searchDto: SearchProductsDto): Promise<{
    products: Product[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const {
      q,
      type,
      status,
      merchant_id,
      min_price,
      max_price,
      attributes,
      sort = 'newest',
      locale = 'en',
      limit = 20,
      offset = 0,
    } = searchDto;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.translations', 'translation')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.product_images', 'image')
      .leftJoinAndSelect('product.merchant', 'merchant')
      .where('translation.locale = :locale', { locale });

    // Add rank to SELECT if searching
    if (q) {
      query.addSelect(
        `ts_rank(translation.search_vector, plainto_tsquery('simple', :query))`,
        'search_rank',
      );
    }

    // Default filter: only active products (unless status is specified)
    if (!status) {
      query.andWhere('product.status = :status', { status: ProductStatus.ACTIVE });
    } else {
      query.andWhere('product.status = :status', { status });
    }

    // Full-text search
    if (q) {
      query.andWhere(
        `translation.search_vector @@ plainto_tsquery('simple', :query) OR
         translation.title ILIKE :likeQuery OR
         translation.description ILIKE :likeQuery`,
        { query: q, likeQuery: `%${q}%` },
      );
    }

    // Type filter
    if (type) {
      query.andWhere('product.type = :type', { type });
    }

    // Merchant filter
    if (merchant_id) {
      query.andWhere('product.merchant_id = :merchant_id', { merchant_id });
    }

    // Price range filter
    if (min_price !== undefined) {
      query.andWhere('variant.price_minor >= :min_price', { min_price });
    }

    if (max_price !== undefined) {
      query.andWhere('variant.price_minor <= :max_price', { max_price });
    }

    // Attribute filters
    if (attributes && Object.keys(attributes).length > 0) {
      Object.entries(attributes).forEach(([key, value], index) => {
        query.andWhere(`variant.attrs ->> :key${index} = :value${index}`, {
          [`key${index}`]: key,
          [`value${index}`]: value,
        });
      });
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query.orderBy('variant.price_minor', 'ASC');
        break;
      case 'price_desc':
        query.orderBy('variant.price_minor', 'DESC');
        break;
      case 'popular':
        query.orderBy('product.sales_count', 'DESC');
        break;
      case 'rating':
        query.orderBy('product.rating', 'DESC', 'NULLS LAST');
        break;
      case 'newest':
      default:
        query.orderBy('product.created_at', 'DESC');
    }

    // Add relevance sorting for search queries
    if (q) {
      query.addOrderBy('search_rank', 'DESC');
    }

    // Pagination
    query.skip(offset).take(limit);

    // Execute query
    const [products, total] = await query.getManyAndCount();

    return {
      products,
      total,
      limit,
      offset,
    };
  }

  /**
   * Generate unique slug
   */
  private async generateUniqueSlug(name: string, locale: string): Promise<string> {
    // Transliterate and sanitize
    const baseSlug = this.slugify(name);

    let slug = baseSlug;
    let counter = 0;

    // Check uniqueness
    while (
      await this.translationRepository.findOne({
        where: { slug, locale: locale as TranslationLocale },
      })
    ) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }

  /**
   * Slugify text
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Generate SKU
   */
  private generateSku(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `SKU-${timestamp}-${random}`;
  }

  /**
   * Get module info
   */
  getModuleInfo(): string {
    return 'Catalog Module - Manages product catalog and categories';
  }
}
