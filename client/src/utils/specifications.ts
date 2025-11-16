/**
 * Utility functions for formatting product specifications
 */

import type { ProductSpecifications } from '@/types/catalog';

/**
 * Translation function type
 */
type TranslationFunction = (key: string) => string;

/**
 * Specification display configuration
 */
interface SpecificationConfig {
  labelKey: string; // i18n translation key
  format?: (value: any, t: TranslationFunction) => string; // Optional formatter with translation
}

/**
 * Mapping of specification keys to display labels and formatters
 */
const SPECIFICATION_CONFIG: Record<string, SpecificationConfig> = {
  volume_ml: {
    labelKey: 'specifications.volume',
    format: (value: number) => `${value} ml`,
  },
  color: {
    labelKey: 'specifications.color',
  },
  box_included: {
    labelKey: 'specifications.boxIncluded',
    format: (value: boolean, t: TranslationFunction) => (value ? t('common.yes') : t('common.no')),
  },
  weight: {
    labelKey: 'specifications.weight',
    format: (value: number) => `${value} kg`,
  },
  brand: {
    labelKey: 'specifications.brand',
  },
  size: {
    labelKey: 'specifications.size',
  },
  material: {
    labelKey: 'specifications.material',
  },
  duration: {
    labelKey: 'specifications.duration',
    format: (value: number) => `${value} min`,
  },
  capacity: {
    labelKey: 'specifications.capacity',
  },
  access_duration: {
    labelKey: 'specifications.accessDuration',
    format: (value: number) => `${value} days`,
  },
};

/**
 * Format a specification value for display
 */
export function formatSpecification(
  key: string,
  value: any,
  t: TranslationFunction,
): string {
  const config = SPECIFICATION_CONFIG[key];

  if (!config || value === null || value === undefined) {
    return String(value);
  }

  if (config.format) {
    return config.format(value, t);
  }

  return String(value);
}

/**
 * Get display label for specification key
 */
export function getSpecificationLabel(key: string, t: TranslationFunction): string {
  const config = SPECIFICATION_CONFIG[key];
  if (config) {
    return t(config.labelKey);
  }

  // Fallback: capitalize first letter and replace underscores with spaces
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format specifications object for display
 * Returns array of [label, formattedValue] tuples
 */
export function formatSpecifications(
  specifications: ProductSpecifications | Record<string, any>,
  t: TranslationFunction,
): Array<[string, string]> {
  return Object.entries(specifications)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([key, value]) => [
      getSpecificationLabel(key, t),
      formatSpecification(key, value, t),
    ]);
}
