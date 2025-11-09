import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { CacheService } from '../../common/services/cache.service';
import { Product, ProductStatus } from '../../database/entities/product.entity';
import { ProductVariant, InventoryPolicy } from '../../database/entities/product-variant.entity';
import { Cart, CartSummary } from './interfaces/cart.interface';
import { CartItem } from './interfaces/cart-item.interface';
import { AddToCartDto } from './dto/add-to-cart.dto';

const CART_MAX_ITEMS = 50;
const CART_MAX_ITEM_QUANTITY = 99;
const GUEST_CART_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const USER_CART_TTL = 30 * 24 * 60 * 60; // 30 days in seconds (persistent but with cleanup)

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly cacheService: CacheService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
  ) {}

  /**
   * Get cart for user or guest session
   */
  async getCart(userId?: string, sessionId?: string): Promise<Cart> {
    if (!userId && !sessionId) {
      throw new BadRequestException('Either userId or sessionId must be provided');
    }

    const cartKey = this.getCartKey(userId, sessionId);
    const cartData = await this.cacheService.get<Cart>(cartKey);

    if (!cartData) {
      return this.createEmptyCart(userId, sessionId);
    }

    // Validate items are still available and prices haven't changed significantly
    const validatedCart = await this.validateCart(cartData);

    return validatedCart;
  }

  /**
   * Add item to cart
   */
  async addToCart(
    userId: string | undefined,
    sessionId: string | undefined,
    addItemDto: AddToCartDto,
  ): Promise<Cart> {
    const cart = await this.getCart(userId, sessionId);

    // Check max items limit
    if (cart.items.length >= CART_MAX_ITEMS) {
      throw new BadRequestException(`Cart cannot contain more than ${CART_MAX_ITEMS} items`);
    }

    // Fetch product with variant
    const product = await this.productRepository.findOne({
      where: { id: addItemDto.productId },
      relations: ['variants', 'merchant'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('Product is not available for purchase');
    }

    // Find the variant
    const variant = await this.variantRepository.findOne({
      where: { id: addItemDto.variantId, product_id: product.id },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    if (variant.status !== 'active') {
      throw new BadRequestException('Product variant is not available');
    }

    // Check inventory for physical products
    if (product.type === 'PHYSICAL') {
      await this.checkInventory(variant, addItemDto.quantity);
    }

    // Check for existing item in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === addItemDto.productId && item.variantId === addItemDto.variantId,
    );

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const newQuantity = cart.items[existingItemIndex].quantity + addItemDto.quantity;

      if (newQuantity > CART_MAX_ITEM_QUANTITY) {
        throw new BadRequestException(
          `Cannot add more than ${CART_MAX_ITEM_QUANTITY} of the same item`,
        );
      }

      // Check inventory for new total quantity
      if (product.type === 'PHYSICAL') {
        await this.checkInventory(variant, newQuantity);
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      // Update price to current price
      cart.items[existingItemIndex].price = variant.price_minor;
    } else {
      // Add new item
      const cartItem: CartItem = {
        productId: addItemDto.productId,
        variantId: addItemDto.variantId,
        quantity: addItemDto.quantity,
        price: variant.price_minor,
        currency: variant.currency,
        merchantId: product.merchant_id,
        type: this.mapProductType(product.type),
        metadata: addItemDto.metadata,
      };

      cart.items.push(cartItem);
    }

    cart.updatedAt = new Date();

    // Save cart to Redis
    await this.saveCart(cart);

    this.logger.log(
      `Added item ${addItemDto.productId} to cart for ${userId ? `user ${userId}` : `session ${sessionId}`}`,
    );

    return cart;
  }

  /**
   * Update item quantity in cart
   */
  async updateQuantity(
    userId: string | undefined,
    sessionId: string | undefined,
    itemId: string,
    quantity: number,
  ): Promise<Cart> {
    if (quantity === 0) {
      return this.removeFromCart(userId, sessionId, itemId);
    }

    if (quantity > CART_MAX_ITEM_QUANTITY) {
      throw new BadRequestException(`Quantity cannot exceed ${CART_MAX_ITEM_QUANTITY} per item`);
    }

    const cart = await this.getCart(userId, sessionId);
    const itemIndex = cart.items.findIndex((item) => this.getItemId(item) === itemId);

    if (itemIndex < 0) {
      throw new NotFoundException('Item not found in cart');
    }

    const item = cart.items[itemIndex];

    // Check inventory for physical products
    if (item.type === 'physical') {
      const variant = await this.variantRepository.findOne({
        where: { id: item.variantId },
      });

      if (variant) {
        await this.checkInventory(variant, quantity);
      }
    }

    cart.items[itemIndex].quantity = quantity;
    cart.updatedAt = new Date();

    await this.saveCart(cart);

    this.logger.log(`Updated quantity for item ${itemId} to ${quantity}`);

    return cart;
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(
    userId: string | undefined,
    sessionId: string | undefined,
    itemId: string,
  ): Promise<Cart> {
    const cart = await this.getCart(userId, sessionId);

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => this.getItemId(item) !== itemId);

    if (cart.items.length === initialLength) {
      throw new NotFoundException('Item not found in cart');
    }

    cart.updatedAt = new Date();

    await this.saveCart(cart);

    this.logger.log(`Removed item ${itemId} from cart`);

    return cart;
  }

  /**
   * Clear all items from cart
   */
  async clearCart(userId?: string, sessionId?: string): Promise<Cart> {
    const cart = await this.getCart(userId, sessionId);
    cart.items = [];
    cart.updatedAt = new Date();

    await this.saveCart(cart);

    this.logger.log(`Cleared cart for ${userId ? `user ${userId}` : `session ${sessionId}`}`);

    return cart;
  }

  /**
   * Merge guest cart into user cart on login
   */
  async mergeGuestCart(guestSessionId: string, userId: string): Promise<Cart> {
    const guestCart = await this.getCart(undefined, guestSessionId);
    const userCart = await this.getCart(userId, undefined);

    if (guestCart.items.length === 0) {
      return userCart;
    }

    this.logger.log(
      `Merging guest cart (${guestCart.items.length} items) into user ${userId} cart (${userCart.items.length} items)`,
    );

    // Merge items
    for (const guestItem of guestCart.items) {
      const existingItemIndex = userCart.items.findIndex(
        (item) => item.productId === guestItem.productId && item.variantId === guestItem.variantId,
      );

      if (existingItemIndex >= 0) {
        // Combine quantities (respecting max limit)
        const combinedQuantity = Math.min(
          userCart.items[existingItemIndex].quantity + guestItem.quantity,
          CART_MAX_ITEM_QUANTITY,
        );
        userCart.items[existingItemIndex].quantity = combinedQuantity;
      } else {
        // Add new item if we haven't hit the max items limit
        if (userCart.items.length < CART_MAX_ITEMS) {
          userCart.items.push(guestItem);
        }
      }
    }

    // Validate merged cart
    const validatedCart = await this.validateCart(userCart);
    validatedCart.updatedAt = new Date();

    // Save merged cart
    await this.saveCart(validatedCart);

    // Clear guest cart
    await this.cacheService.delete(this.getCartKey(undefined, guestSessionId));

    this.logger.log(`Merged cart saved with ${validatedCart.items.length} items`);

    return validatedCart;
  }

  /**
   * Get cart summary with totals
   */
  async getCartSummary(userId?: string, sessionId?: string): Promise<CartSummary> {
    const cart = await this.getCart(userId, sessionId);

    if (cart.items.length === 0) {
      return {
        itemCount: 0,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        currency: 'USD',
        merchantCount: 0,
        itemsByMerchant: {},
      };
    }

    // Group items by merchant
    const itemsByMerchant = cart.items.reduce(
      (acc, item) => {
        if (!acc[item.merchantId]) {
          acc[item.merchantId] = [];
        }
        acc[item.merchantId].push(item);
        return acc;
      },
      {} as Record<string, CartItem[]>,
    );

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Tax calculation (simplified - 10% default)
    const taxRate = 0.1;
    const tax = Math.round(subtotal * taxRate);

    // Shipping will be calculated in checkout
    const shipping = 0;

    const total = subtotal + tax + shipping;

    return {
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      tax,
      shipping,
      total,
      currency: cart.items[0]?.currency || 'USD',
      merchantCount: Object.keys(itemsByMerchant).length,
      itemsByMerchant,
    };
  }

  /**
   * Private helper methods
   */

  private getCartKey(userId?: string, sessionId?: string): string {
    if (userId) {
      return `cart:user:${userId}`;
    }
    return `cart:session:${sessionId}`;
  }

  private createEmptyCart(userId?: string, sessionId?: string): Cart {
    const now = new Date();
    return {
      id: uuid(),
      userId,
      sessionId,
      items: [],
      createdAt: now,
      updatedAt: now,
      expiresAt: userId ? undefined : new Date(Date.now() + GUEST_CART_TTL * 1000),
    };
  }

  private async saveCart(cart: Cart): Promise<void> {
    const cartKey = this.getCartKey(cart.userId, cart.sessionId);
    const ttl = cart.userId ? USER_CART_TTL : GUEST_CART_TTL;

    await this.cacheService.set(cartKey, cart, ttl);
  }

  private getItemId(item: CartItem): string {
    return `${item.productId}-${item.variantId}`;
  }

  private mapProductType(type: string): 'physical' | 'digital' | 'service' {
    switch (type) {
      case 'PHYSICAL':
        return 'physical';
      case 'SERVICE':
      case 'COURSE':
        return 'service';
      default:
        return 'digital';
    }
  }

  private async checkInventory(variant: ProductVariant, quantity: number): Promise<void> {
    // If inventory policy is CONTINUE, we don't enforce stock
    if (variant.inventory_policy === InventoryPolicy.CONTINUE) {
      return;
    }

    // Check if we have enough inventory
    if (
      variant.inventory_policy === InventoryPolicy.DENY &&
      variant.inventory_quantity < quantity
    ) {
      throw new BadRequestException(
        `Insufficient inventory. Only ${variant.inventory_quantity} available`,
      );
    }
  }

  private async validateCart(cart: Cart): Promise<Cart> {
    const validatedItems: CartItem[] = [];

    for (const item of cart.items) {
      try {
        const product = await this.productRepository.findOne({
          where: { id: item.productId },
        });

        if (!product || product.status !== ProductStatus.ACTIVE) {
          this.logger.warn(`Product ${item.productId} is no longer available, removing from cart`);
          continue;
        }

        const variant = await this.variantRepository.findOne({
          where: { id: item.variantId, product_id: product.id },
        });

        if (!variant || variant.status !== 'active') {
          this.logger.warn(`Variant ${item.variantId} is no longer available, removing from cart`);
          continue;
        }

        // Update price if changed
        if (item.price !== variant.price_minor) {
          this.logger.log(
            `Price changed for item ${item.productId}: ${item.price} -> ${variant.price_minor}`,
          );
          item.price = variant.price_minor;
        }

        // Check inventory for physical products
        if (item.type === 'physical') {
          if (
            variant.inventory_policy === InventoryPolicy.DENY &&
            variant.inventory_quantity < item.quantity
          ) {
            this.logger.warn(
              `Insufficient inventory for ${item.productId}, adjusting quantity to ${variant.inventory_quantity}`,
            );
            if (variant.inventory_quantity > 0) {
              item.quantity = variant.inventory_quantity;
            } else {
              continue; // Skip item if out of stock
            }
          }
        }

        validatedItems.push(item);
      } catch (error) {
        this.logger.error(`Error validating cart item ${item.productId}:`, error);
        // Skip invalid items
      }
    }

    cart.items = validatedItems;
    return cart;
  }
}
