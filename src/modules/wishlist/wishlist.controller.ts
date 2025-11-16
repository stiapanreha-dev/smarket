import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { WishlistResponseDto } from './dto/wishlist-response.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Public } from '@modules/auth/decorators/public.decorator';
import { User } from '@database/entities/user.entity';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  /**
   * Get current user's wishlist
   */
  @Get()
  @ApiOperation({ summary: 'Get user wishlist' })
  @ApiResponse({
    status: 200,
    description: 'Wishlist retrieved successfully',
    type: WishlistResponseDto,
  })
  async getWishlist(@CurrentUser() user: User): Promise<WishlistResponseDto> {
    return this.wishlistService.getWishlist(user.id);
  }

  /**
   * Add product to wishlist
   */
  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add product to wishlist' })
  @ApiResponse({
    status: 200,
    description: 'Product added to wishlist successfully',
    type: WishlistResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Product already in wishlist',
  })
  async addToWishlist(
    @CurrentUser() user: User,
    @Body() addToWishlistDto: AddToWishlistDto,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.addToWishlist(user.id, addToWishlistDto.productId);
  }

  /**
   * Remove product from wishlist
   */
  @Delete('items/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove product from wishlist' })
  @ApiParam({
    name: 'productId',
    description: 'Product ID to remove',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product removed from wishlist successfully',
    type: WishlistResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found in wishlist',
  })
  async removeFromWishlist(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.removeFromWishlist(user.id, productId);
  }

  /**
   * Check if product is in wishlist
   */
  @Get('check/:productId')
  @ApiOperation({ summary: 'Check if product is in wishlist' })
  @ApiParam({
    name: 'productId',
    description: 'Product ID to check',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Check result',
  })
  async checkInWishlist(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
  ): Promise<{ inWishlist: boolean }> {
    const inWishlist = await this.wishlistService.isInWishlist(user.id, productId);
    return { inWishlist };
  }

  /**
   * Get wishlist item count
   */
  @Get('count')
  @ApiOperation({ summary: 'Get wishlist item count' })
  @ApiResponse({
    status: 200,
    description: 'Item count retrieved successfully',
  })
  async getWishlistCount(@CurrentUser() user: User): Promise<{ count: number }> {
    const count = await this.wishlistService.getWishlistCount(user.id);
    return { count };
  }

  /**
   * Clear entire wishlist
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear entire wishlist' })
  @ApiResponse({
    status: 200,
    description: 'Wishlist cleared successfully',
    type: WishlistResponseDto,
  })
  async clearWishlist(@CurrentUser() user: User): Promise<WishlistResponseDto> {
    return this.wishlistService.clearWishlist(user.id);
  }

  /**
   * Generate share token for wishlist
   */
  @Post('share')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate share token for wishlist' })
  @ApiResponse({
    status: 200,
    description: 'Share token generated successfully',
  })
  async generateShareToken(@CurrentUser() user: User): Promise<{ shareToken: string }> {
    const shareToken = await this.wishlistService.generateShareToken(user.id);
    return { shareToken };
  }

  /**
   * Get wishlist by share token (public access)
   */
  @Get('shared/:token')
  @Public()
  @ApiOperation({ summary: 'Get wishlist by share token (public)' })
  @ApiParam({
    name: 'token',
    description: 'Share token',
    example: 'abc123def456',
  })
  @ApiResponse({
    status: 200,
    description: 'Wishlist retrieved successfully',
    type: WishlistResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Wishlist not found',
  })
  async getSharedWishlist(@Param('token') token: string): Promise<WishlistResponseDto> {
    return this.wishlistService.getWishlistByShareToken(token);
  }

  /**
   * Revoke share token
   */
  @Delete('share')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke wishlist share token' })
  @ApiResponse({
    status: 204,
    description: 'Share token revoked successfully',
  })
  async revokeShareToken(@CurrentUser() user: User): Promise<void> {
    await this.wishlistService.revokeShareToken(user.id);
  }
}
