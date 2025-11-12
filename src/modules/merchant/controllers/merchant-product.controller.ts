import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
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

@ApiTags('Merchant Products')
@Controller('api/v1/merchant/products')
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
    description: 'Get paginated list of products for the authenticated merchant with filters'
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
      where: { user_id: req.user.id },
    });

    if (!merchant) {
      throw new NotFoundException(
        'Merchant profile not found. Please complete merchant registration.',
      );
    }

    return this.merchantProductService.getMerchantProducts(merchant.id, filters);
  }

  /**
   * Delete a product (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a product',
    description: 'Soft delete a product by setting its status to DELETED'
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
      where: { user_id: req.user.id },
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
    description: 'Toggle product between active and inactive status'
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
      where: { user_id: req.user.id },
    });

    if (!merchant) {
      throw new NotFoundException(
        'Merchant profile not found. Please complete merchant registration.',
      );
    }

    return this.merchantProductService.toggleProductStatus(id, merchant.id);
  }
}
