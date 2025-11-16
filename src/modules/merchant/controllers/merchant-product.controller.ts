import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { Merchant } from '../../../database/entities/merchant.entity';
import { MerchantProductService } from '../services/merchant-product.service';
import { AuthenticatedRequest } from '../../booking/interfaces/authenticated-request.interface';
import { MerchantProductFiltersDto } from '../dto/merchant-product-filters.dto';
import { CreateMerchantProductDto } from '../dto/create-merchant-product.dto';
import { UpdateMerchantProductDto } from '../dto/update-merchant-product.dto';

@ApiTags('Merchant Products')
@Controller('merchant/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MERCHANT)
@ApiBearerAuth()
export class MerchantProductController {
  constructor(
    private readonly merchantProductService: MerchantProductService,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {}

  /**
   * Get merchant's products with filters and pagination
   */
  @Get()
  @ApiOperation({
    summary: "Get merchant's products",
    description: 'Get paginated list of products for the authenticated merchant with filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Merchant profile not found',
  })
  async getMerchantProducts(
    @Request() req: AuthenticatedRequest,
    @Query() filters: MerchantProductFiltersDto,
  ) {
    // Get merchant profile for the authenticated user
    const merchant = await this.merchantRepository.findOne({
      where: { owner_id: req.user.id },
    });

    if (!merchant) {
      throw new NotFoundException(
        'Merchant profile not found. Please complete merchant registration.',
      );
    }

    return this.merchantProductService.getMerchantProducts(merchant.id, filters);
  }

  /**
   * Get a single product by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get a product by ID',
    description: 'Get a single product by ID for the authenticated merchant',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found or does not belong to merchant',
  })
  async getProduct(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    // Get merchant profile for the authenticated user
    const merchant = await this.merchantRepository.findOne({
      where: { owner_id: req.user.id },
    });

    if (!merchant) {
      throw new NotFoundException(
        'Merchant profile not found. Please complete merchant registration.',
      );
    }

    return this.merchantProductService.getProductById(id, merchant.id);
  }

  /**
   * Create a new product
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new product',
    description: 'Create a new product for the authenticated merchant',
  })
  @ApiBody({ type: CreateMerchantProductDto })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Merchant profile not found',
  })
  async createProduct(
    @Request() req: AuthenticatedRequest,
    @Body() createProductDto: CreateMerchantProductDto,
  ) {
    // Get merchant profile for the authenticated user
    const merchant = await this.merchantRepository.findOne({
      where: { owner_id: req.user.id },
    });

    if (!merchant) {
      throw new NotFoundException(
        'Merchant profile not found. Please complete merchant registration.',
      );
    }

    return this.merchantProductService.createProduct(
      merchant.id,
      req.user.id,
      createProductDto,
    );
  }

  /**
   * Update an existing product
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a product',
    description: 'Update an existing product',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({ type: UpdateMerchantProductDto })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found or does not belong to merchant',
  })
  async updateProduct(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateMerchantProductDto,
  ) {
    // Get merchant profile for the authenticated user
    const merchant = await this.merchantRepository.findOne({
      where: { owner_id: req.user.id },
    });

    if (!merchant) {
      throw new NotFoundException(
        'Merchant profile not found. Please complete merchant registration.',
      );
    }

    return this.merchantProductService.updateProduct(
      id,
      merchant.id,
      req.user.id,
      updateProductDto,
    );
  }

  /**
   * Upload product image
   */
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload product image',
    description: 'Upload an image for a product',
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        file_name: { type: 'string' },
        size: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file',
  })
  async uploadImage(
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Get merchant profile for the authenticated user
    const merchant = await this.merchantRepository.findOne({
      where: { owner_id: req.user.id },
    });

    if (!merchant) {
      throw new NotFoundException(
        'Merchant profile not found. Please complete merchant registration.',
      );
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    return this.merchantProductService.uploadProductImage(file, merchant.id);
  }

  /**
   * Delete a product (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a product',
    description: 'Soft delete a product by setting its status to DELETED',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found or does not belong to merchant',
  })
  async deleteProduct(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    // Get merchant profile for the authenticated user
    const merchant = await this.merchantRepository.findOne({
      where: { owner_id: req.user.id },
    });

    if (!merchant) {
      throw new NotFoundException(
        'Merchant profile not found. Please complete merchant registration.',
      );
    }

    await this.merchantProductService.deleteProduct(id, merchant.id);
  }

  /**
   * Toggle product active/inactive status
   */
  @Patch(':id/toggle-status')
  @ApiOperation({
    summary: 'Toggle product status',
    description: 'Toggle product between active and inactive status',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Product status toggled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found or does not belong to merchant',
  })
  async toggleProductStatus(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    // Get merchant profile for the authenticated user
    const merchant = await this.merchantRepository.findOne({
      where: { owner_id: req.user.id },
    });

    if (!merchant) {
      throw new NotFoundException(
        'Merchant profile not found. Please complete merchant registration.',
      );
    }

    return this.merchantProductService.toggleProductStatus(id, merchant.id);
  }
}
