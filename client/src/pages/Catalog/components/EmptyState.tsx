import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaBoxOpen } from 'react-icons/fa';
import './EmptyState.css';

interface EmptyStateProps {
  onClearFilters?: () => void;
  hasFilters?: boolean;
}

/**
 * Empty state component when no products found
 */
export function EmptyState({ onClearFilters, hasFilters = false }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="empty-state text-center py-5">
      <div className="empty-state-icon mb-4">
        {hasFilters ? (
          <FaSearch size={64} className="text-muted" />
        ) : (
          <FaBoxOpen size={64} className="text-muted" />
        )}
      </div>
      <h4 className="mb-3">
        {hasFilters
          ? t('catalog.emptyState.noResults')
          : t('catalog.emptyState.noProducts')}
      </h4>
      <p className="text-muted mb-4">
        {hasFilters
          ? t('catalog.emptyState.tryDifferentFilters')
          : t('catalog.emptyState.checkBackLater')}
      </p>
      {hasFilters && onClearFilters && (
        <Button variant="primary" onClick={onClearFilters}>
          {t('catalog.filters.clearAll')}
        </Button>
      )}
    </div>
  );
}
