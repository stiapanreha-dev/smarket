import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSettings, VatSettingsValue, DEFAULT_VAT_SETTINGS } from '@database/entities';
import { CacheService } from '@common/services/cache.service';
import { UpdateVatSettingsDto } from './dto/update-vat-settings.dto';

const VAT_SETTINGS_KEY = 'vat';
const VAT_CACHE_KEY = 'platform:settings:vat';
const VAT_CACHE_TTL = 5 * 60; // 5 minutes

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(PlatformSettings)
    private readonly settingsRepository: Repository<PlatformSettings>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Get VAT settings from cache or database
   * Returns default settings if not found
   */
  async getVatSettings(): Promise<VatSettingsValue> {
    // Try cache first
    const cached = await this.cacheService.get<VatSettingsValue>(VAT_CACHE_KEY);
    if (cached) {
      this.logger.debug('VAT settings cache hit');
      return cached;
    }

    // Get from database
    const settings = await this.settingsRepository.findOne({
      where: { key: VAT_SETTINGS_KEY },
    });

    if (!settings) {
      this.logger.log('VAT settings not found, returning defaults');
      return DEFAULT_VAT_SETTINGS;
    }

    const vatSettings = settings.value as VatSettingsValue;

    // Cache for 5 minutes
    await this.cacheService.set(VAT_CACHE_KEY, vatSettings, VAT_CACHE_TTL);

    return vatSettings;
  }

  /**
   * Update VAT settings
   */
  async updateVatSettings(dto: UpdateVatSettingsDto): Promise<VatSettingsValue> {
    const vatValue: VatSettingsValue = {
      mode: dto.mode,
      default_rate: dto.default_rate,
      country_rates: dto.country_rates,
    };

    let settings = await this.settingsRepository.findOne({
      where: { key: VAT_SETTINGS_KEY },
    });

    if (settings) {
      settings.value = vatValue;
      await this.settingsRepository.save(settings);
    } else {
      settings = this.settingsRepository.create({
        key: VAT_SETTINGS_KEY,
        value: vatValue,
        description: 'VAT/Tax settings for the platform',
      });
      await this.settingsRepository.save(settings);
    }

    // Invalidate cache
    await this.cacheService.delete(VAT_CACHE_KEY);
    // Also invalidate tax rate caches
    await this.invalidateTaxRateCaches();

    this.logger.log(`VAT settings updated: mode=${dto.mode}, rate=${dto.default_rate}%`);

    return vatValue;
  }

  /**
   * Initialize default VAT settings if not exists
   * Called on application startup
   */
  async initializeDefaults(): Promise<void> {
    const existing = await this.settingsRepository.findOne({
      where: { key: VAT_SETTINGS_KEY },
    });

    if (!existing) {
      const settings = this.settingsRepository.create({
        key: VAT_SETTINGS_KEY,
        value: DEFAULT_VAT_SETTINGS,
        description: 'VAT/Tax settings for the platform',
      });
      await this.settingsRepository.save(settings);
      this.logger.log('Initialized default VAT settings');
    }
  }

  /**
   * Invalidate all tax rate caches when settings change
   */
  private async invalidateTaxRateCaches(): Promise<void> {
    try {
      // The tax rate caches use pattern: tax:rate:*
      // We'll delete them by pattern
      await this.cacheService.deletePattern('tax:rate:*');
      this.logger.debug('Tax rate caches invalidated');
    } catch (error) {
      this.logger.warn('Failed to invalidate tax rate caches', error);
    }
  }

  /**
   * Get VAT rate for a specific country
   */
  async getVatRateForCountry(country: string): Promise<number> {
    const settings = await this.getVatSettings();
    return settings.country_rates[country] ?? settings.default_rate;
  }

  /**
   * Check if VAT is included in prices
   */
  async isVatIncluded(): Promise<boolean> {
    const settings = await this.getVatSettings();
    return settings.mode === 'included';
  }
}
