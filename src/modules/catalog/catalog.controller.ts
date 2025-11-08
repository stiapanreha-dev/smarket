import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../../common/decorators/user.decorator';
import { UserRole } from '../../database/entities/user.entity';

@ApiTags('Products')
@Controller('api/v1/products')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new product',
    description:
      'Create a new product. Only merchants can create products. Translations for all 3 locales (en, ru, ar) are required.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or missing translations',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have merchant role',
  })
  async createProduct(@Body() createProductDto: CreateProductDto, @User() user: any) {
    // Extract merchant_id from user object
    // Assuming user has merchant_id when role is MERCHANT
    const merchantId = user.merchant_id || user.id;

    return this.catalogService.createProduct(merchantId, createProductDto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Search and filter products',
    description:
      'Search products with filters, sorting, and pagination. Supports full-text search, price range, attributes, etc.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products retrieved successfully',
  })
  async searchProducts(@Query() searchDto: SearchProductsDto) {
    return this.catalogService.searchProducts(searchDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Retrieve a single product by its UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  async getProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogService.findOneById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get product by slug',
    description: 'Retrieve a single product by its slug and locale',
  })
  @ApiParam({
    name: 'slug',
    description: 'Product slug',
    type: 'string',
  })
  @ApiQuery({
    name: 'locale',
    description: 'Locale for the slug',
    required: false,
    enum: ['en', 'ru', 'ar'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  async getProductBySlug(@Param('slug') slug: string, @Query('locale') locale: string = 'en') {
    return this.catalogService.findOneBySlug(slug, locale);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update product',
    description:
      'Update product details. Only the merchant who owns the product or admin can update it.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found or user does not have permission',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to update this product',
  })
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @User() user: any,
  ) {
    const merchantId = user.merchant_id || user.id;
    return this.catalogService.updateProduct(id, merchantId, updateProductDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT, UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete product (soft delete)',
    description:
      'Soft delete a product by setting its status to DELETED. Only the merchant who owns the product or admin can delete it.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found or user does not have permission',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete product with active orders',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to delete this product',
  })
  async deleteProduct(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    const merchantId = user.merchant_id || user.id;
    await this.catalogService.deleteProduct(id, merchantId, user.id);
  }

  @Get('info/module')
  @ApiOperation({
    summary: 'Get module info',
    description: 'Get information about the catalog module',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Module info retrieved successfully',
  })
  getModuleInfo(): string {
    return this.catalogService.getModuleInfo();
  }
}
