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
import { ProductSearchService } from './product-search.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { AdvancedSearchProductsDto } from './dto/advanced-search-products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../../common/decorators/user.decorator';
import { UserRole } from '../../database/entities/user.entity';

@ApiTags('Products')
@Controller('api/v1/products')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly productSearchService: ProductSearchService,
  ) {}

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
    summary: 'Search and filter products (basic)',
    description:
      'Basic product search with filters, sorting, and pagination. For advanced search with facets, use /search endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products retrieved successfully',
  })
  async searchProducts(@Query() searchDto: SearchProductsDto) {
    return this.catalogService.searchProducts(searchDto);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Advanced product search with facets',
    description: `
      Advanced product search with the following features:
      - Full-text search with PostgreSQL pg_trgm for fuzzy matching
      - Search across all 3 languages (en/ru/ar)
      - Filters: type, price range, merchant, status, attributes, availability, SKU
      - Sorting: relevance, price, date, popularity, rating
      - Cursor-based pagination for large datasets (max 100 items per page)
      - Faceted search with aggregations
      - Highlighting of matching terms
      - Redis caching for popular queries (5 min TTL)
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results with facets and pagination',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          description: 'Array of products matching search criteria',
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 150 },
            limit: { type: 'number', example: 20 },
            offset: { type: 'number', example: 0 },
            page: { type: 'number', example: 1 },
            total_pages: { type: 'number', example: 8 },
            next_cursor: { type: 'string', nullable: true },
          },
        },
        facets: {
          type: 'object',
          nullable: true,
          properties: {
            types: {
              type: 'object',
              example: { PHYSICAL: 100, DIGITAL: 50 },
            },
            price_ranges: {
              type: 'object',
              example: { '0-500': 30, '500-1000': 70, '1000+': 50 },
            },
            merchants: {
              type: 'object',
              description: 'Top 10 merchants with product count',
            },
            availability: {
              type: 'object',
              properties: {
                in_stock: { type: 'number' },
                out_of_stock: { type: 'number' },
              },
            },
          },
        },
        performance: {
          type: 'object',
          properties: {
            query_time_ms: { type: 'number', example: 150 },
            cache_hit: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  async advancedSearch(@Query() searchDto: AdvancedSearchProductsDto) {
    return this.productSearchService.search(searchDto);
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

  @Get('autocomplete')
  @ApiOperation({
    summary: 'Autocomplete search suggestions',
    description: 'Get search suggestions for products, services, and categories as user types',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query',
    required: true,
    type: 'string',
  })
  @ApiQuery({
    name: 'locale',
    description: 'Locale for translations',
    required: false,
    enum: ['en', 'ru', 'ar'],
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search suggestions retrieved successfully',
  })
  async autocomplete(
    @Query('q') query: string,
    @Query('locale') locale: string = 'en',
  ) {
    return this.productSearchService.autocomplete(query, locale);
  }
}
