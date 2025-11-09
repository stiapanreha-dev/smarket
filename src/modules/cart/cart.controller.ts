import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Session,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Cart } from './interfaces/cart.interface';
import { v4 as uuid } from 'uuid';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Get current cart
   */
  @Get()
  @ApiOperation({ summary: 'Get current cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
  })
  async getCart(
    @Headers('x-user-id') userId?: string,
    @Session() session?: any,
  ): Promise<{ cart: Cart; summary: any }> {
    const sessionId = session?.id || this.generateSessionId();

    const cart = await this.cartService.getCart(userId, sessionId);
    const summary = await this.cartService.getCartSummary(userId, sessionId);

    return {
      cart,
      summary,
    };
  }

  /**
   * Add item to cart
   */
  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({
    status: 200,
    description: 'Item added to cart successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid product or insufficient inventory',
  })
  @ApiResponse({
    status: 404,
    description: 'Product or variant not found',
  })
  async addToCart(
    @Body() addItemDto: AddToCartDto,
    @Headers('x-user-id') userId?: string,
    @Session() session?: any,
  ): Promise<Cart> {
    const sessionId = session?.id || this.generateSessionId();

    return this.cartService.addToCart(userId, sessionId, addItemDto);
  }

  /**
   * Update item quantity
   */
  @Put('items/:itemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({
    name: 'itemId',
    description: 'Cart item ID (format: productId-variantId)',
    example: '123e4567-e89b-12d3-a456-426614174000-123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 200,
    description: 'Item quantity updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found in cart',
  })
  async updateQuantity(
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateCartItemDto,
    @Headers('x-user-id') userId?: string,
    @Session() session?: any,
  ): Promise<Cart> {
    const sessionId = session?.id;

    return this.cartService.updateQuantity(userId, sessionId, itemId, updateDto.quantity);
  }

  /**
   * Remove item from cart
   */
  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({
    name: 'itemId',
    description: 'Cart item ID (format: productId-variantId)',
    example: '123e4567-e89b-12d3-a456-426614174000-123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: 200,
    description: 'Item removed from cart successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found in cart',
  })
  async removeItem(
    @Param('itemId') itemId: string,
    @Headers('x-user-id') userId?: string,
    @Session() session?: any,
  ): Promise<Cart> {
    const sessionId = session?.id;

    return this.cartService.removeFromCart(userId, sessionId, itemId);
  }

  /**
   * Clear cart
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all items from cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully',
  })
  async clearCart(@Headers('x-user-id') userId?: string, @Session() session?: any): Promise<Cart> {
    const sessionId = session?.id;

    return this.cartService.clearCart(userId, sessionId);
  }

  /**
   * Merge guest cart into user cart (called on login)
   */
  @Post('merge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Merge guest cart into user cart' })
  @ApiResponse({
    status: 200,
    description: 'Carts merged successfully',
  })
  async mergeCart(
    @Headers('x-user-id') userId: string,
    @Body('guestSessionId') guestSessionId: string,
  ): Promise<Cart> {
    if (!userId) {
      throw new Error('User ID is required for cart merge');
    }

    return this.cartService.mergeGuestCart(guestSessionId, userId);
  }

  /**
   * Get cart summary
   */
  @Get('summary')
  @ApiOperation({ summary: 'Get cart summary with totals' })
  @ApiResponse({
    status: 200,
    description: 'Cart summary retrieved successfully',
  })
  async getCartSummary(@Headers('x-user-id') userId?: string, @Session() session?: any) {
    const sessionId = session?.id || this.generateSessionId();

    return this.cartService.getCartSummary(userId, sessionId);
  }

  /**
   * Generate session ID for guest users
   */
  private generateSessionId(): string {
    return uuid();
  }
}
