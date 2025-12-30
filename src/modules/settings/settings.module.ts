import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformSettings } from '@database/entities';
import { CacheService } from '@common/services/cache.service';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformSettings])],
  controllers: [SettingsController],
  providers: [SettingsService, CacheService],
  exports: [SettingsService],
})
export class SettingsModule implements OnModuleInit {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Initialize default settings on module startup
   */
  async onModuleInit() {
    await this.settingsService.initializeDefaults();
  }
}
