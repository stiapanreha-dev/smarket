import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { MerchantApplicationService } from '../services/merchant-application.service';
import { CreateMerchantApplicationDto } from '../dto/merchant-application.dto';

@ApiTags('Merchant Applications')
@Controller('merchant-applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MerchantApplicationController {
  constructor(private readonly applicationService: MerchantApplicationService) {}

  @Post()
  @ApiOperation({ summary: 'Submit merchant application' })
  @ApiResponse({ status: 201, description: 'Application submitted successfully' })
  @ApiResponse({ status: 409, description: 'Already a merchant or has pending application' })
  async createApplication(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateMerchantApplicationDto,
  ) {
    return this.applicationService.createApplication(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my application status' })
  @ApiResponse({ status: 200, description: 'Application found' })
  @ApiResponse({ status: 404, description: 'No application found' })
  async getMyApplication(@CurrentUser('sub') userId: string) {
    return this.applicationService.getUserApplication(userId);
  }
}
