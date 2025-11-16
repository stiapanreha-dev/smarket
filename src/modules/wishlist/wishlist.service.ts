import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Wishlist } from '@database/entities/wishlist.entity';
import { WishlistItem } from '@database/entities/wishlist-item.entity';
import { Product, ProductStatus } from '@database/entities/product.entity';
import { WishlistResponseDto, WishlistItemDto } from './dto/wishlist-response.dto';

@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name);

  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(WishlistItem)
    private readonly wishlistItemRepository: Repository<WishlistItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Get or create wishlist for user
   */
  async getOrCreateWishlist(userId: string): Promise<Wishlist> {
    let wishlist = await this.wishlistRepository.findOne({
      where: { user_id: userId },
      relations: ['items', 'items.product'],
    });

    if (!wishlist) {
      wishlist = this.wishlistRepository.create({
        user_id: userId,
        items: [],
      });
      await this.wishlistRepository.save(wishlist);
      this.logger.log(`Created new wishlist for user ${userId}`);
    }

    return wishlist;
  }

  /**
   * Get wishlist for user
   */
  async getWishlist(userId: string): Promise<WishlistResponseDto> {
    const wishlist = await this.getOrCreateWishlist(userId);

    // Filter out items with deleted products
    const validItems = wishlist.items.filter(
      (item) => item.product && item.product.status !== ProductStatus.DELETED,
    );

    return this.mapToDto(wishlist, validItems);
  }

  /**
   * Add product to wishlist
   */
  async addToWishlist(userId: string, productId: string): Promise<WishlistResponseDto> {
    // Verify product exists and is available
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status === ProductStatus.DELETED) {
      throw new BadRequestException('Product is no longer available');
    }

    // Get or create wishlist
    const wishlist = await this.getOrCreateWishlist(userId);

    // Check if product is already in wishlist
    const existingItem = await this.wishlistItemRepository.findOne({
      where: {
        wishlist_id: wishlist.id,
        product_id: productId,
      },
    });

    if (existingItem) {
      throw new ConflictException('Product is already in wishlist');
    }

    // Add item to wishlist
    const wishlistItem = this.wishlistItemRepository.create({
      wishlist_id: wishlist.id,
      product_id: productId,
    });

    await this.wishlistItemRepository.save(wishlistItem);

    this.logger.log(`Added product ${productId} to wishlist for user ${userId}`);

    // Return updated wishlist
    return this.getWishlist(userId);
  }

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(userId: string, productId: string): Promise<WishlistResponseDto> {
    const wishlist = await this.getOrCreateWishlist(userId);

    // Find the wishlist item
    const wishlistItem = await this.wishlistItemRepository.findOne({
      where: {
        wishlist_id: wishlist.id,
        product_id: productId,
      },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Product not found in wishlist');
    }

    // Remove item
    await this.wishlistItemRepository.remove(wishlistItem);

    this.logger.log(`Removed product ${productId} from wishlist for user ${userId}`);

    // Return updated wishlist
    return this.getWishlist(userId);
  }

  /**
   * Check if product is in wishlist
   */
  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { user_id: userId },
    });

    if (!wishlist) {
      return false;
    }

    const wishlistItem = await this.wishlistItemRepository.findOne({
      where: {
        wishlist_id: wishlist.id,
        product_id: productId,
      },
    });

    return !!wishlistItem;
  }

  /**
   * Clear entire wishlist
   */
  async clearWishlist(userId: string): Promise<WishlistResponseDto> {
    const wishlist = await this.getOrCreateWishlist(userId);

    // Delete all items
    await this.wishlistItemRepository.delete({ wishlist_id: wishlist.id });

    this.logger.log(`Cleared wishlist for user ${userId}`);

    // Return empty wishlist
    return this.getWishlist(userId);
  }

  /**
   * Get wishlist item count
   */
  async getWishlistCount(userId: string): Promise<number> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { user_id: userId },
    });

    if (!wishlist) {
      return 0;
    }

    return this.wishlistItemRepository.count({
      where: { wishlist_id: wishlist.id },
    });
  }

  /**
   * Generate share token for wishlist
   * Returns the share token that can be used to access the wishlist publicly
   */
  async generateShareToken(userId: string): Promise<string> {
    const wishlist = await this.getOrCreateWishlist(userId);

    // Generate a secure random token
    const shareToken = randomBytes(32).toString('hex');

    wishlist.share_token = shareToken;
    await this.wishlistRepository.save(wishlist);

    this.logger.log(`Generated share token for wishlist ${wishlist.id}`);

    return shareToken;
  }

  /**
   * Get wishlist by share token (public access)
   */
  async getWishlistByShareToken(shareToken: string): Promise<WishlistResponseDto> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { share_token: shareToken },
      relations: ['items', 'items.product'],
    });

    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }

    // Filter out items with deleted products
    const validItems = wishlist.items.filter(
      (item) => item.product && item.product.status !== ProductStatus.DELETED,
    );

    return this.mapToDto(wishlist, validItems);
  }

  /**
   * Revoke share token for wishlist
   */
  async revokeShareToken(userId: string): Promise<void> {
    const wishlist = await this.getOrCreateWishlist(userId);

    wishlist.share_token = null;
    await this.wishlistRepository.save(wishlist);

    this.logger.log(`Revoked share token for wishlist ${wishlist.id}`);
  }

  /**
   * Map wishlist entity to DTO
   */
  private mapToDto(wishlist: Wishlist, items: WishlistItem[]): WishlistResponseDto {
    return {
      id: wishlist.id,
      userId: wishlist.user_id,
      items: items.map((item) => this.mapItemToDto(item)),
      itemCount: items.length,
      createdAt: wishlist.created_at,
      updatedAt: wishlist.updated_at,
    };
  }

  /**
   * Map wishlist item entity to DTO
   */
  private mapItemToDto(item: WishlistItem): WishlistItemDto {
    const dto: WishlistItemDto = {
      id: item.id,
      productId: item.product_id,
      createdAt: item.created_at,
    };

    // Include product details if available
    if (item.product) {
      dto.product = {
        id: item.product.id,
        title: item.product.title,
        slug: item.product.slug,
        imageUrl: item.product.image_url,
        basePriceMinor: item.product.base_price_minor,
        currency: item.product.currency,
        status: item.product.status,
        merchantId: item.product.merchant_id,
      };
    }

    return dto;
  }
}
