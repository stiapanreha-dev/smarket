import { Controller, Get, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { Merchant } from '../../../database/entities/merchant.entity';
import { MerchantDashboardService } from '../services/merchant-dashboard.service';
import { DashboardStatsDto } from '../dto/dashboard-stats.dto';
import { AuthenticatedRequest } from '../../booking/interfaces/authenticated-request.interface';

@ApiTags('Merchant Dashboard')
@Controller('api/v1/merchant/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MERCHANT)
@ApiBearerAuth()
export class MerchantDashboardController {
  constructor(
    private readonly dashboardService: MerchantDashboardService,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get merchant dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Merchant profile not found',
  })
  async getDashboardStats(@Request() req: AuthenticatedRequest): Promise<DashboardStatsDto> {
    // Get merchant profile for the authenticated user
    const merchant = await this.merchantRepository.findOne({
      where: { owner_id: req.user.id },
    });

    if (!merchant) {
      throw new NotFoundException(
        'Merchant profile not found. Please complete merchant registration.',
      );
    }

    return this.dashboardService.getDashboardStats(merchant.id);
  }
}
