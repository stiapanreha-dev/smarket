import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product, ProductStatus } from '../../../database/entities/product.entity';
import { MerchantProductFiltersDto } from '../dto/merchant-product-filters.dto';

@Injectable()
export class MerchantProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
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
