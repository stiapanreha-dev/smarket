import { Button, Card } from 'react-bootstrap';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import type { SearchSuggestion } from '@/api/search.api';
import { usePopularSearches } from '@/hooks/useSearch';

interface SearchEmptyStateProps {
  query: string;
  suggestions?: SearchSuggestion[];
  hasFilters?: boolean;
  onClearFilters?: () => void;
  message?: string;
}

/**
 * Empty state component for search results
 * Shows when no results are found with suggestions and popular searches
 */
export function SearchEmptyState({
  query,
  suggestions = [],
  hasFilters = false,
  onClearFilters,
  message,
}: SearchEmptyStateProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: popularSearches = [] } = usePopularSearches();

  // Filter suggestions to show only corrections
  const corrections = suggestions.filter((s) => s.type === 'correction');

  return (
    <div className="search-empty-state text-center py-5">
      <FaSearch className="text-muted mb-3" size={64} />

      <h3 className="mb-3">
        {message || t('search.noResults', `No results for "${query}"`)}
      </h3>

      {/* "Did you mean?" suggestions */}
      {corrections.length > 0 && (
        <Card className="mb-4 mx-auto" style={{ maxWidth: '500px' }}>
          <Card.Body>
            <Card.Title className="h6 text-start">
              {t('search.didYouMean', 'Did you mean?')}
            </Card.Title>
            <div className="d-flex flex-wrap gap-2 justify-content-start">
              {corrections.map((suggestion) => (
                <Button
                  key={suggestion.query}
                  variant="outline-primary"
                  size="sm"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(suggestion.query)}`)}
                >
                  {suggestion.query}
                  {suggestion.count && (
                    <span className="text-muted ms-2">({suggestion.count})</span>
                  )}
                </Button>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Clear filters suggestion */}
      {hasFilters && onClearFilters && (
        <div className="mb-4">
          <p className="text-muted mb-2">
            {t('search.tryRemovingFilters', 'Try removing some filters to see more results')}
          </p>
          <Button variant="outline-secondary" size="sm" onClick={onClearFilters}>
            <FaTimes className="me-2" />
            {t('search.clearFilters', 'Clear all filters')}
          </Button>
        </div>
      )}

      {/* Search tips */}
      <div className="search-tips mb-4 text-start mx-auto" style={{ maxWidth: '500px' }}>
        <h5 className="h6 mb-3">{t('search.suggestions', 'Search suggestions:')}</h5>
        <ul className="text-muted">
          <li>{t('search.tip1', 'Check your spelling')}</li>
          <li>{t('search.tip2', 'Try more general keywords')}</li>
          <li>{t('search.tip3', 'Try different keywords')}</li>
          <li>{t('search.tip4', 'Remove filters to see more results')}</li>
        </ul>
      </div>

      {/* Popular searches */}
      {popularSearches.length > 0 && (
        <div className="popular-searches mx-auto" style={{ maxWidth: '500px' }}>
          <h5 className="h6 mb-3">{t('search.popularSearches', 'Popular searches:')}</h5>
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            {popularSearches.slice(0, 10).map((popularQuery) => (
              <Link
                key={popularQuery}
                to={`/search?q=${encodeURIComponent(popularQuery)}`}
                className="btn btn-outline-secondary btn-sm"
              >
                {popularQuery}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Browse catalog link */}
      <div className="mt-4">
        <Link to="/catalog" className="btn btn-primary">
          {t('search.browseCatalog', 'Browse all products')}
        </Link>
      </div>
    </div>
  );
}

export default SearchEmptyState;
