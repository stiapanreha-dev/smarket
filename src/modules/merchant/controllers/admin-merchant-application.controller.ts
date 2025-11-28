import { Controller, Get, Post, Param, Body, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { UserRole } from '@/database/entities/user.entity';
import { MerchantApplicationService } from '../services/merchant-application.service';
import {
  ApproveMerchantApplicationDto,
  RejectMerchantApplicationDto,
} from '../dto/merchant-application.dto';
import { ApplicationStatus } from '@/database/entities/merchant-application.entity';

@ApiTags('Admin - Merchant Applications')
@Controller('admin/merchant-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminMerchantApplicationController {
  constructor(private readonly applicationService: MerchantApplicationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all merchant applications' })
  @ApiQuery({ name: 'status', enum: ApplicationStatus, required: false })
  @ApiResponse({ status: 200, description: 'Applications retrieved' })
  async getAllApplications(@Query('status') status?: ApplicationStatus) {
    return this.applicationService.getAllApplications(status);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending merchant applications' })
  @ApiResponse({ status: 200, description: 'Pending applications retrieved' })
  async getPendingApplications() {
    return this.applicationService.getPendingApplications();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiResponse({ status: 200, description: 'Application retrieved' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async getApplicationById(@Param('id', ParseUUIDPipe) id: string) {
    return this.applicationService.getApplicationById(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve merchant application' })
  @ApiResponse({ status: 200, description: 'Application approved, merchant created' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 400, description: 'Application is not pending' })
  async approveApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ApproveMerchantApplicationDto,
  ) {
    return this.applicationService.approveApplication(id, adminId, dto);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject merchant application' })
  @ApiResponse({ status: 200, description: 'Application rejected' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 400, description: 'Application is not pending' })
  async rejectApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: RejectMerchantApplicationDto,
  ) {
    return this.applicationService.rejectApplication(id, adminId, dto);
  }
}
