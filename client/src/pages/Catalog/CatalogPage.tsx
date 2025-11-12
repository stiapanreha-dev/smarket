import { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Row, Col, Button, Dropdown, Offcanvas } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaFilter, FaTh, FaList } from 'react-icons/fa';
import { ProductType, ProductSortOption } from '@/types/catalog';
import { useProducts } from '@/hooks/useCatalog';
import { useWindowResize } from '@/hooks/usePerformance';
import { Navbar, Footer } from '@/components/layout';
import { CatalogSidebar, CatalogFilters } from './components/CatalogSidebar';
import { ProductsGrid } from './components/ProductsGrid';
import { VirtualizedProductsGrid } from './components/VirtualizedProductsGrid';
import { ProductsGridSkeleton } from './components/ProductsGridSkeleton';
import { EmptyState } from './components/EmptyState';
import { CatalogPagination } from './components/CatalogPagination';
import './CatalogPage.css';

/**
 * Main Catalog Page Component
 * Features:
 * - Filters (search, categories, product type, price range)
 * - Sorting options
 * - Grid/List view toggle
 * - Pagination
 * - URL query params sync
 * - Responsive mobile drawer
 */
export function CatalogPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRTL = i18n.language === 'ar';

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Track window resize with throttling (200ms) for better performance
  const { width: windowWidth } = useWindowResize(200);

  // Calculate container width for virtualized grid based on window width
  const containerWidth = useMemo(() => {
    // Approximate container width based on Bootstrap breakpoints
    if (windowWidth >= 1400) return 1320 * 0.75; // XXL container * 9/12 columns
    if (windowWidth >= 1200) return 1140 * 0.75; // XL container * 9/12 columns
    if (windowWidth >= 992) return 960 * 0.75;   // LG container * 9/12 columns
    return windowWidth * 0.9; // Smaller screens with padding
  }, [windowWidth]);

  // Parse filters from URL
  const filters = useMemo<CatalogFilters>(() => {
    const search = searchParams.get('q') || undefined;
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const productType = searchParams.get('type') as ProductType | undefined;
    const minPrice = searchParams.get('min_price')
      ? parseFloat(searchParams.get('min_price')!)
      : undefined;
    const maxPrice = searchParams.get('max_price')
      ? parseFloat(searchParams.get('max_price')!)
      : undefined;

    return {
      search,
      categories: categories.length > 0 ? categories : undefined,
      productType,
      minPrice,
      maxPrice,
    };
  }, [searchParams]);

  // Parse sort and pagination from URL
  const sortBy = (searchParams.get('sort') as ProductSortOption) || 'newest';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  // Fetch products
  const { data, isLoading, error } = useProducts({
    q: filters.search,
    type: filters.productType,
    min_price: filters.minPrice ? filters.minPrice * 100 : undefined, // Convert to minor units
    max_price: filters.maxPrice ? filters.maxPrice * 100 : undefined,
    sort: sortBy,
    page: currentPage,
    limit,
    locale: i18n.language as any,
  });

  // Update URL params when filters change - memoized with useCallback
  const updateFilters = useCallback((newFilters: CatalogFilters) => {
    const params = new URLSearchParams(searchParams);

    // Update or remove search param
    if (newFilters.search) {
      params.set('q', newFilters.search);
    } else {
      params.delete('q');
    }

    // Update or remove categories param
    if (newFilters.categories && newFilters.categories.length > 0) {
      params.set('categories', newFilters.categories.join(','));
    } else {
      params.delete('categories');
    }

    // Update or remove type param
    if (newFilters.productType) {
      params.set('type', newFilters.productType);
    } else {
      params.delete('type');
    }

    // Update or remove price params
    if (newFilters.minPrice) {
      params.set('min_price', newFilters.minPrice.toString());
    } else {
      params.delete('min_price');
    }

    if (newFilters.maxPrice) {
      params.set('max_price', newFilters.maxPrice.toString());
    } else {
      params.delete('max_price');
    }

    // Reset to page 1 when filters change
    params.set('page', '1');

    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  // Clear all filters - memoized with useCallback
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('sort', sortBy);
    setSearchParams(params);
  }, [sortBy, setSearchParams]);

  // Update sort - memoized with useCallback
  const updateSort = useCallback((newSort: ProductSortOption) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    params.set('page', '1'); // Reset to page 1
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  // Update page - memoized with useCallback
  const updatePage = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);

    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, setSearchParams]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.search ||
    (filters.categories && filters.categories.length > 0) ||
    filters.productType ||
    filters.minPrice ||
    filters.maxPrice;

  // Sort options
  const sortOptions: { value: ProductSortOption; label: string }[] = [
    { value: 'newest', label: t('catalog.sort.newest') },
    { value: 'popular', label: t('catalog.sort.popular') },
    { value: 'price_asc', label: t('catalog.sort.priceLowToHigh') },
    { value: 'price_desc', label: t('catalog.sort.priceHighToLow') },
    { value: 'rating', label: t('catalog.sort.rating') },
  ];

  const currentSortLabel =
    sortOptions.find((opt) => opt.value === sortBy)?.label || sortOptions[0].label;

  return (
    <>
      <Navbar />
      <div className={`catalog-page ${isRTL ? 'rtl' : ''}`}>
        <Container fluid="xl" className="py-4">
        <Row>
          {/* Desktop Sidebar */}
          <Col lg={3} className="d-none d-lg-block">
            <CatalogSidebar
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
            />
          </Col>

          {/* Main Content */}
          <Col lg={9}>
            {/* Toolbar */}
            <div className="catalog-toolbar mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex align-items-center gap-2">
                {/* Mobile Filter Button */}
                <Button
                  variant="outline-secondary"
                  className="d-lg-none"
                  onClick={() => setShowMobileFilters(true)}
                >
                  <FaFilter className="me-2" />
                  {t('catalog.filters.title')}
                </Button>

                {/* Results count */}
                {data && (
                  <span className="text-muted">
                    {t('catalog.resultsCount', {
                      count: data.pagination.total,
                      start: (currentPage - 1) * limit + 1,
                      end: Math.min(currentPage * limit, data.pagination.total),
                    })}
                  </span>
                )}
              </div>

              <div className="d-flex align-items-center gap-2">
                {/* Sort Dropdown */}
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" size="sm">
                    {t('catalog.sort.label')}: {currentSortLabel}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {sortOptions.map((option) => (
                      <Dropdown.Item
                        key={option.value}
                        active={sortBy === option.value}
                        onClick={() => updateSort(option.value)}
                      >
                        {option.label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>

                {/* View Toggle */}
                <div className="btn-group" role="group">
                  <Button
                    variant={viewMode === 'grid' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    title={t('catalog.view.grid')}
                  >
                    <FaTh />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    title={t('catalog.view.list')}
                  >
                    <FaList />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading && <ProductsGridSkeleton count={limit} viewMode={viewMode} />}

            {error && (
              <div className="alert alert-danger">
                {t('catalog.error.loadFailed')}
              </div>
            )}

            {!isLoading && !error && data && (
              <>
                {data.data.length > 0 ? (
                  <>
                    {/* Use virtualized grid for large lists in grid mode for better performance */}
                    {viewMode === 'grid' && data.pagination.total > 100 ? (
                      <VirtualizedProductsGrid
                        products={data.data}
                        containerWidth={containerWidth}
                      />
                    ) : (
                      <ProductsGrid products={data.data} viewMode={viewMode} />
                    )}
                    <CatalogPagination
                      currentPage={currentPage}
                      totalPages={data.pagination.pages}
                      onPageChange={updatePage}
                    />
                  </>
                ) : (
                  <EmptyState
                    hasFilters={hasActiveFilters}
                    onClearFilters={clearFilters}
                  />
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>

      {/* Mobile Filters Drawer */}
      <Offcanvas
        show={showMobileFilters}
        onHide={() => setShowMobileFilters(false)}
        placement={isRTL ? 'end' : 'start'}
        className="catalog-mobile-filters"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>{t('catalog.filters.title')}</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <CatalogSidebar
            filters={filters}
            onFiltersChange={(newFilters) => {
              updateFilters(newFilters);
              setShowMobileFilters(false);
            }}
            onClearFilters={() => {
              clearFilters();
              setShowMobileFilters(false);
            }}
          />
        </Offcanvas.Body>
      </Offcanvas>
      </div>
      <Footer />
    </>
  );
}

export default CatalogPage;
