import { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Row, Col, Button, Dropdown, Offcanvas } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaFilter, FaTh, FaList } from 'react-icons/fa';
import { ProductType } from '@/types/catalog';
import type { ProductSortOption } from '@/types/catalog';
import { useProducts } from '@/hooks/useCatalog';
import { Navbar, Footer } from '@/components/layout';
import { CatalogSidebar } from './components/CatalogSidebar';
import type { CatalogFilters } from './components/CatalogSidebar';
import { ProductsGrid } from './components/ProductsGrid';
import { ProductsGridSkeleton } from './components/ProductsGridSkeleton';
import { EmptyState } from './components/EmptyState';
import { SEO } from '@/components/SEO';
import { StructuredData } from '@/components/StructuredData';
import './CatalogPage.css';

interface CatalogPageProps {
  /** Default product type filter (used when rendering as home page) */
  defaultType?: ProductType;
}

/**
 * Main Catalog Page Component
 * Features:
 * - Filters (search, categories, product type, price range)
 * - Sorting options
 * - Grid/List view toggle
 * - Infinite scroll with "Show more" button
 * - URL query params sync
 * - Responsive mobile drawer
 */
export function CatalogPage({ defaultType }: CatalogPageProps = {}) {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRTL = i18n.language === 'ar';

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parse filters from URL
  const filters = useMemo<CatalogFilters>(() => {
    const search = searchParams.get('q') || undefined;
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    // Use URL param if present, otherwise fall back to defaultType prop
    const productType = (searchParams.get('type') as ProductType | undefined) || defaultType;
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
  }, [searchParams, defaultType]);

  // Parse sort from URL
  const sortBy = (searchParams.get('sort') as ProductSortOption) || 'newest';

  // State for infinite scroll
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const limit = 12; // Load 12 items at a time (3 rows of 4)

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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setDisplayedProducts([]);
    setHasMore(true);
  }, [filters.search, filters.productType, filters.minPrice, filters.maxPrice, sortBy]);

  // Update displayed products when data changes
  useEffect(() => {
    if (!data) return;

    if (currentPage === 1) {
      // First page - replace all products
      setDisplayedProducts(data.data);
    } else {
      // Subsequent pages - append products
      setDisplayedProducts(prev => [...prev, ...data.data]);
      setIsLoadingMore(false);
    }

    setHasMore(data.pagination.page < data.pagination.pages);
  }, [data]);

  // Load more products
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setCurrentPage(prev => prev + 1);
  }, [isLoadingMore, hasMore]);

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

    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  // Clear all filters - memoized with useCallback
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    params.set('sort', sortBy);
    setSearchParams(params);
  }, [sortBy, setSearchParams]);

  // Update sort - memoized with useCallback
  const updateSort = useCallback((newSort: ProductSortOption) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    setSearchParams(params);
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

  // Generate dynamic SEO based on filters
  const generatePageTitle = () => {
    if (filters.productType) {
      const typeLabel = filters.productType === ProductType.PHYSICAL
        ? t('product.type.physical')
        : filters.productType === ProductType.SERVICE
        ? t('product.type.service')
        : t('product.type.course');
      return `Shop ${typeLabel} Products`;
    }
    if (filters.search) {
      return `Search Results for "${filters.search}"`;
    }
    return 'Shop All Products';
  };

  const generatePageDescription = () => {
    const parts = ['Discover and shop'];

    if (filters.productType) {
      const typeLabel = filters.productType === ProductType.PHYSICAL
        ? 'physical goods'
        : filters.productType === ProductType.SERVICE
        ? 'professional services'
        : 'digital products and courses';
      parts.push(typeLabel);
    } else {
      parts.push('physical goods, digital products, and services');
    }

    if (filters.search) {
      parts.push(`matching "${filters.search}"`);
    }

    parts.push('on SnailMarketplace. Wide selection, secure checkout, multi-language support.');

    return parts.join(' ');
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://snailmarketplace.com';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : `${baseUrl}/catalog`;

  return (
    <>
      {/* SEO Meta Tags */}
      <SEO
        title={generatePageTitle()}
        description={generatePageDescription()}
        keywords="catalog, products, buy online, marketplace, shopping, physical goods, digital products, services"
        type="website"
        url={currentUrl}
      />

      {/* Breadcrumb Structured Data */}
      <StructuredData
        type="breadcrumb"
        breadcrumbs={[
          { name: 'Home', url: baseUrl },
          { name: 'Catalog', url: `${baseUrl}/catalog` },
        ]}
      />

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
                      start: 1,
                      end: displayedProducts.length,
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
                {displayedProducts.length > 0 ? (
                  <>
                    <ProductsGrid products={displayedProducts} viewMode={viewMode} />

                    {/* Show More Button */}
                    {hasMore && (
                      <div className="text-center mt-4 mb-4">
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={handleLoadMore}
                          disabled={isLoadingMore}
                          className="px-5"
                        >
                          {isLoadingMore ? t('catalog.loading') : t('catalog.showMore')}
                        </Button>
                      </div>
                    )}
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
