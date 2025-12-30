import { Controller, Get, Put, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@database/entities';
import { SettingsService } from './settings.service';
import { UpdateVatSettingsDto } from './dto/update-vat-settings.dto';

@ApiTags('Admin Settings')
@ApiBearerAuth()
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(private readonly settingsService: SettingsService) {}

  /**
   * GET /api/v1/admin/settings/vat
   * Get current VAT settings
   */
  @Get('vat')
  @ApiOperation({ summary: 'Get VAT settings' })
  async getVatSettings() {
    this.logger.log('Getting VAT settings');
    const settings = await this.settingsService.getVatSettings();
    return { data: settings };
  }

  /**
   * PUT /api/v1/admin/settings/vat
   * Update VAT settings
   */
  @Put('vat')
  @ApiOperation({ summary: 'Update VAT settings' })
  async updateVatSettings(@Body() dto: UpdateVatSettingsDto) {
    this.logger.log(`Updating VAT settings: mode=${dto.mode}, rate=${dto.default_rate}`);
    const settings = await this.settingsService.updateVatSettings(dto);
    return { data: settings, message: 'VAT settings updated successfully' };
  }
}
