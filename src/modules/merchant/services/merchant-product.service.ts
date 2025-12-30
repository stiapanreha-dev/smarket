import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Product, ProductStatus } from '../../../database/entities/product.entity';
import {
  ProductTranslation,
  TranslationLocale,
} from '../../../database/entities/product-translation.entity';
import { ProductVariant } from '../../../database/entities/product-variant.entity';
import { MerchantProductFiltersDto } from '../dto/merchant-product-filters.dto';
import { CreateMerchantProductDto } from '../dto/create-merchant-product.dto';
import { UpdateMerchantProductDto } from '../dto/update-merchant-product.dto';

@Injectable()
export class MerchantProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductTranslation)
    private readonly translationRepository: Repository<ProductTranslation>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get paginated list of products for a specific merchant
   */
  async getMerchantProducts(merchantId: string, filters: MerchantProductFiltersDto) {
    const { type, status, search, page = 1, limit = 10 } = filters;

    // Build query
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.merchant_id = :merchantId', { merchantId })
      .andWhere('product.status != :deletedStatus', { deletedStatus: ProductStatus.DELETED });

    // Apply filters
    if (type) {
      queryBuilder.andWhere('product.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('product.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(product.title) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    queryBuilder.orderBy('product.created_at', 'DESC');

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const [products, total] = await queryBuilder.getManyAndCount();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return {
      data: products,
      pagination: {
        total,
        page,
        limit,
        pages: totalPages,
        offset,
      },
    };
  }

  /**
   * Create a new product
   * Accepts simplified DTO from frontend and creates product with translations for all 3 locales
   */
  async createProduct(
    merchantId: string,
    userId: string,
    dto: CreateMerchantProductDto,
  ): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create product
      const product = queryRunner.manager.create(Product, {
        merchant_id: merchantId,
        type: dto.type,
        title: dto.title, // Add title for products table
        short_description: dto.short_description,
        description: dto.description,
        base_price_minor: dto.base_price_minor || 0,
        currency: dto.currency || 'USD',
        attrs: dto.attrs,
        image_url: dto.image_url,
        images: dto.images,
        seo: dto.seo,
        metadata: dto.metadata,
        status: dto.status || ProductStatus.DRAFT,
      });

      const savedProduct = await queryRunner.manager.save(product);

      // Generate slug from title
      const baseSlug = dto.slug || this.slugify(dto.title);

      // Create translations for all 3 locales (using same title/description for now)
      const locales: TranslationLocale[] = [
        TranslationLocale.EN,
        TranslationLocale.RU,
        TranslationLocale.AR,
      ];
      for (const locale of locales) {
        const slug = await this.generateUniqueSlug(baseSlug, locale, queryRunner);

        const translation = queryRunner.manager.create(ProductTranslation, {
          product_id: savedProduct.id,
          locale,
          title: dto.title,
          description: dto.description || null,
          slug,
        });

        await queryRunner.manager.save(translation);
      }

      // Handle variants
      if (dto.variants && dto.variants.length > 0) {
        for (const variantDto of dto.variants) {
          const variant = queryRunner.manager.create(ProductVariant, {
            product_id: savedProduct.id,
            ...variantDto,
          });
          await queryRunner.manager.save(variant);
        }
      } else {
        // Create default variant if none provided
        const defaultSku = this.generateSku();
        const defaultVariant = queryRunner.manager.create(ProductVariant, {
          product_id: savedProduct.id,
          sku: defaultSku,
          price_minor: dto.base_price_minor || 0,
          currency: dto.currency || 'USD',
          inventory_quantity: 0,
        });
        await queryRunner.manager.save(defaultVariant);
      }

      await queryRunner.commitTransaction();

      // Return full product with relations
      return this.getProductById(savedProduct.id, merchantId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(
    productId: string,
    merchantId: string,
    userId: string,
    dto: UpdateMerchantProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId, merchant_id: merchantId },
      relations: ['translations', 'variants'],
    });

    if (!product) {
      throw new NotFoundException('Product not found or you do not have permission to update it');
    }

    // Update basic fields
    if (dto.type !== undefined) product.type = dto.type;
    if (dto.status !== undefined) product.status = dto.status;
    if (dto.base_price_minor !== undefined) product.base_price_minor = dto.base_price_minor;
    if (dto.currency !== undefined) product.currency = dto.currency;
    if (dto.attrs !== undefined) product.attrs = dto.attrs;
    if (dto.image_url !== undefined) product.image_url = dto.image_url;
    if (dto.images !== undefined) product.images = dto.images;
    if (dto.seo !== undefined) product.seo = dto.seo;
    if (dto.metadata !== undefined) product.metadata = dto.metadata;
    if (dto.title !== undefined) product.title = dto.title;
    if (dto.short_description !== undefined) product.short_description = dto.short_description;
    if (dto.description !== undefined) product.description = dto.description;

    await this.productRepository.save(product);

    // Update translations if title or description changed
    if (dto.title || dto.description) {
      for (const translation of product.translations) {
        if (dto.title) translation.title = dto.title;
        if (dto.description !== undefined) translation.description = dto.description || null;

        // Update slug if title changed
        if (dto.title && dto.slug) {
          translation.slug = dto.slug;
        } else if (dto.title) {
          translation.slug = await this.generateUniqueSlug(
            this.slugify(dto.title),
            translation.locale,
          );
        }

        await this.translationRepository.save(translation);
      }
    }

    // Update variants if provided
    if (dto.variants && dto.variants.length > 0) {
      // For now, update the first variant (assuming single variant products)
      if (product.variants && product.variants.length > 0) {
        const existingVariant = product.variants[0];
        const variantDto = dto.variants[0];

        // Update variant fields
        if (variantDto.sku !== undefined) existingVariant.sku = variantDto.sku;
        if (variantDto.title !== undefined) existingVariant.title = variantDto.title;
        if (variantDto.price_minor !== undefined)
          existingVariant.price_minor = variantDto.price_minor;
        if (variantDto.currency !== undefined) existingVariant.currency = variantDto.currency;
        if (variantDto.compare_at_price_minor !== undefined) {
          existingVariant.compare_at_price_minor = variantDto.compare_at_price_minor;
        }
        if (variantDto.inventory_quantity !== undefined) {
          existingVariant.inventory_quantity = variantDto.inventory_quantity;
        }
        if (variantDto.requires_shipping !== undefined) {
          existingVariant.requires_shipping = variantDto.requires_shipping;
        }
        if (variantDto.taxable !== undefined) existingVariant.taxable = variantDto.taxable;
        if (variantDto.image_url !== undefined) existingVariant.image_url = variantDto.image_url;

        // Update variant attrs
        if (variantDto.attrs !== undefined) {
          existingVariant.attrs = {
            ...existingVariant.attrs,
            ...variantDto.attrs,
          };
        }

        await this.variantRepository.save(existingVariant);
      }
    }

    // Return updated product
    return this.getProductById(productId, merchantId);
  }

  /**
   * Get product by ID with all relations
   */
  async getProductById(productId: string, merchantId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId, merchant_id: merchantId },
      relations: ['translations', 'variants'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Generate unique slug
   */
  private async generateUniqueSlug(
    baseSlug: string,
    locale: TranslationLocale,
    queryRunner?: any,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 0;

    const repo = queryRunner
      ? queryRunner.manager.getRepository(ProductTranslation)
      : this.translationRepository;

    while (
      await repo.findOne({
        where: { slug, locale },
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
   * Upload product image
   */
  async uploadProductImage(
    file: Express.Multer.File,
    merchantId: string,
  ): Promise<{ url: string; file_name: string; size: number }> {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'products', merchantId);
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    // Save file
    await fs.writeFile(filePath, file.buffer);

    // Get base URL from config or use default
    const baseUrl = this.configService.get<string>('API_BASE_URL') || 'http://localhost:3000';
    const url = `${baseUrl}/uploads/products/${merchantId}/${filename}`;

    return {
      url,
      file_name: file.originalname,
      size: file.size,
    };
  }

  /**
   * Delete a product (soft delete by setting status to DELETED)
   */
  async deleteProduct(productId: string, merchantId: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if the product belongs to the merchant
    if (product.merchant_id !== merchantId) {
      throw new ForbiddenException('You do not have permission to delete this product');
    }

    // Soft delete by setting status to DELETED
    product.status = ProductStatus.DELETED;
    await this.productRepository.save(product);
  }

  /**
   * Toggle product status between ACTIVE and INACTIVE
   */
  async toggleProductStatus(productId: string, merchantId: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if the product belongs to the merchant
    if (product.merchant_id !== merchantId) {
      throw new ForbiddenException('You do not have permission to update this product');
    }

    // Toggle status
    if (product.status === ProductStatus.ACTIVE) {
      product.status = ProductStatus.INACTIVE;
    } else if (product.status === ProductStatus.INACTIVE) {
      product.status = ProductStatus.ACTIVE;
    } else {
      // If product is in another status (DRAFT, OUT_OF_STOCK, ARCHIVED), set to ACTIVE
      product.status = ProductStatus.ACTIVE;
    }

    const updatedProduct = await this.productRepository.save(product);

    return updatedProduct;
  }
}
