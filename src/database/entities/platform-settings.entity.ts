import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * VAT calculation mode
 * - 'included': VAT is already included in the product price (default, most countries)
 * - 'on_top': VAT is added on top of the product price (e.g., US sales tax)
 */
export type VatMode = 'included' | 'on_top';

/**
 * VAT settings value structure
 */
export interface VatSettingsValue {
  mode: VatMode;
  default_rate: number; // Percentage (e.g., 20 for 20%)
  country_rates: Record<string, number>; // Country-specific rates
}

/**
 * Platform-wide settings entity
 * Stores configuration as key-value pairs with JSONB values
 */
@Entity('platform_settings')
@Index(['key'], { unique: true })
export class PlatformSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Setting key (e.g., 'vat', 'shipping', 'fees')
   */
  @Column({ type: 'varchar', length: 50, unique: true })
  key: string;

  /**
   * Setting value as JSONB
   * Structure depends on the key type
   */
  @Column({ type: 'jsonb' })
  value: VatSettingsValue | Record<string, unknown>;

  /**
   * Optional description for admin UI
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

/**
 * Default VAT settings
 */
export const DEFAULT_VAT_SETTINGS: VatSettingsValue = {
  mode: 'included',
  default_rate: 22,
  country_rates: {
    RU: 22, // Russia (НДС 22%)
    GB: 20, // UK
    DE: 19, // Germany
    AE: 5, // UAE
    US: 0, // USA (sales tax handled separately)
  },
};
