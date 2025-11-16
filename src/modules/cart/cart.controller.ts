import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Cart } from './interfaces/cart.interface';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Get current cart
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get current cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
  })
  async getCart(
    @Headers('x-user-id') userId?: string,
    @Headers('x-session-id') sessionId?: string,
  ): Promise<{ cart: any; summary: any }> {
    const cart = await this.cartService.getCartWithProducts(userId, sessionId);
    const summary = await this.cartService.getCartSummary(userId, sessionId);

    return {
      cart,
      summary,
    };
  }

  /**
   * Add item to cart
   */
  @Public()
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
    @Headers('x-session-id') sessionId?: string,
  ): Promise<any> {
    await this.cartService.addToCart(userId, sessionId, addItemDto);
    return this.cartService.getCartWithProducts(userId, sessionId);
  }

  /**
   * Update item quantity
   */
  @Public()
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
    @Headers('x-session-id') sessionId?: string,
  ): Promise<any> {
    await this.cartService.updateQuantity(userId, sessionId, itemId, updateDto.quantity);
    return this.cartService.getCartWithProducts(userId, sessionId);
  }

  /**
   * Remove item from cart
   */
  @Public()
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
    @Headers('x-session-id') sessionId?: string,
  ): Promise<any> {
    await this.cartService.removeFromCart(userId, sessionId, itemId);
    return this.cartService.getCartWithProducts(userId, sessionId);
  }

  /**
   * Clear cart
   */
  @Public()
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all items from cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully',
  })
  async clearCart(
    @Headers('x-user-id') userId?: string,
    @Headers('x-session-id') sessionId?: string,
  ): Promise<any> {
    await this.cartService.clearCart(userId, sessionId);
    return this.cartService.getCartWithProducts(userId, sessionId);
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
  ): Promise<any> {
    if (!userId) {
      throw new Error('User ID is required for cart merge');
    }

    await this.cartService.mergeGuestCart(guestSessionId, userId);
    return this.cartService.getCartWithProducts(userId, undefined);
  }

  /**
   * Get cart summary
   */
  @Public()
  @Get('summary')
  @ApiOperation({ summary: 'Get cart summary with totals' })
  @ApiResponse({
    status: 200,
    description: 'Cart summary retrieved successfully',
  })
  async getCartSummary(
    @Headers('x-user-id') userId?: string,
    @Headers('x-session-id') sessionId?: string,
  ) {
    return this.cartService.getCartSummary(userId, sessionId);
  }
}
