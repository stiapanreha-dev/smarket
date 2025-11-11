import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { ProductType } from '@/types/catalog';
import { SearchFilter } from './SearchFilter';
import { CategoryFilter } from './CategoryFilter';
import { ProductTypeFilter } from './ProductTypeFilter';
import { PriceRangeFilter } from './PriceRangeFilter';
import './CatalogSidebar.css';

export interface CatalogFilters {
  search?: string;
  categories?: string[];
  productType?: ProductType;
  minPrice?: number;
  maxPrice?: number;
}

interface CatalogSidebarProps {
  filters: CatalogFilters;
  onFiltersChange: (filters: CatalogFilters) => void;
  onClearFilters: () => void;
}

/**
 * Catalog sidebar with all filters
 */
export function CatalogSidebar({
  filters,
  onFiltersChange,
  onClearFilters,
}: CatalogSidebarProps) {
  const { t } = useTranslation();

  const hasActiveFilters =
    filters.search ||
    (filters.categories && filters.categories.length > 0) ||
    filters.productType ||
    filters.minPrice ||
    filters.maxPrice;

  return (
    <div className="catalog-sidebar">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">{t('catalog.filters.title')}</h5>
        {hasActiveFilters && (
          <Button
            variant="link"
            size="sm"
            onClick={onClearFilters}
            className="text-decoration-none p-0"
          >
            {t('catalog.filters.clearAll')}
          </Button>
        )}
      </div>

      <SearchFilter
        value={filters.search || ''}
        onChange={(search) => onFiltersChange({ ...filters, search })}
      />

      <CategoryFilter
        selectedCategories={filters.categories || []}
        onChange={(categories) => onFiltersChange({ ...filters, categories })}
      />

      <ProductTypeFilter
        value={filters.productType}
        onChange={(productType) => onFiltersChange({ ...filters, productType })}
      />

      <PriceRangeFilter
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        onChange={(minPrice, maxPrice) =>
          onFiltersChange({ ...filters, minPrice, maxPrice })
        }
      />
    </div>
  );
}
