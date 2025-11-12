import { useState, useMemo } from 'react';
import { Container, Row, Col, Button, Dropdown, Offcanvas, Nav, Badge } from 'react-bootstrap';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaFilter, FaTh, FaList, FaArrowRight, FaSearch } from 'react-icons/fa';
import { ProductSortOption } from '@/types/catalog';
import { useSearch, useSearchSuggestions } from '@/hooks/useSearch';
import type { SearchType } from '@/api/search.api';
import { Navbar, Footer } from '@/components/layout';
import { SearchBar } from '@/components/features/SearchBar';
import { CatalogSidebar, CatalogFilters } from '@/pages/Catalog/components/CatalogSidebar';
import { ProductsGrid } from '@/pages/Catalog/components/ProductsGrid';
import { CatalogPagination } from '@/pages/Catalog/components/CatalogPagination';
import { SearchResultsSkeleton } from './components/SearchResultsSkeleton';
import { SearchEmptyState } from './components/SearchEmptyState';
import { CategoryResults } from './components/CategoryResults';
import './SearchPage.css';

/**
 * Search Results Page Component
 *
 * Features:
 * - Search query from URL params (?q=query)
 * - Pre-filled search bar
 * - Tabs: All, Products, Services
 * - Grouped results (Products, Services, Categories)
 * - Filters sidebar (same as Catalog)
 * - Pagination for each group
 * - Loading skeletons
 * - Empty state with suggestions
 * - "Did you mean?" suggestions
 */
export function SearchPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRTL = i18n.language === 'ar';

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Get search query from URL
  const searchQuery = searchParams.get('q') || '';

  // Parse filters from URL
  const filters = useMemo<CatalogFilters>(() => {
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const productType = searchParams.get('product_type') as any;
    const minPrice = searchParams.get('min_price')
      ? parseFloat(searchParams.get('min_price')!)
      : undefined;
    const maxPrice = searchParams.get('max_price')
      ? parseFloat(searchParams.get('max_price')!)
      : undefined;

    return {
      search: searchQuery,
      categories: categories.length > 0 ? categories : undefined,
      productType,
      minPrice,
      maxPrice,
    };
  }, [searchParams, searchQuery]);

  // Parse tab type, sort, and pagination from URL
  const activeTab = (searchParams.get('type') as SearchType) || 'all';
  const sortBy = (searchParams.get('sort') as ProductSortOption) || 'newest';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '12', 10);

  // Fetch search results
  const { data, isLoading, error } = useSearch(
    {
      q: searchQuery,
      type: activeTab,
      min_price: filters.minPrice ? filters.minPrice * 100 : undefined,
      max_price: filters.maxPrice ? filters.maxPrice * 100 : undefined,
      sort: sortBy,
      page: currentPage,
      limit,
      locale: i18n.language as any,
    },
    {
      enabled: searchQuery.length > 0,
    }
  );

  // Fetch search suggestions for typo corrections
  const { data: suggestions } = useSearchSuggestions(searchQuery, {
    enabled: searchQuery.length >= 3 && !isLoading && data?.total_count === 0,
  });

  // Update URL params when filters change
  const updateFilters = (newFilters: CatalogFilters) => {
    const params = new URLSearchParams(searchParams);

    // Keep search query
    if (searchQuery) {
      params.set('q', searchQuery);
    }

    // Update categories
    if (newFilters.categories && newFilters.categories.length > 0) {
      params.set('categories', newFilters.categories.join(','));
    } else {
      params.delete('categories');
    }

    // Update product type
    if (newFilters.productType) {
      params.set('product_type', newFilters.productType);
    } else {
      params.delete('product_type');
    }

    // Update price range
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

    // Reset to page 1
    params.set('page', '1');

    setSearchParams(params);
  };

  // Clear all filters
  const clearFilters = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    params.set('type', activeTab);
    params.set('page', '1');
    params.set('sort', sortBy);
    setSearchParams(params);
  };

  // Update tab
  const updateTab = (newTab: SearchType) => {
    const params = new URLSearchParams(searchParams);
    params.set('type', newTab);
    params.set('page', '1'); // Reset to page 1
    setSearchParams(params);
  };

  // Update sort
  const updateSort = (newSort: ProductSortOption) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    params.set('page', '1');
    setSearchParams(params);
  };

  // Update page
  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check if any filters are active
  const hasActiveFilters =
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

  // Get counts for tabs
  const productsCount = data?.products.pagination.total || 0;
  const servicesCount = data?.services.pagination.total || 0;
  const categoriesCount = data?.categories.length || 0;
  const totalCount = data?.total_count || 0;

  // Render content based on active tab and loading state
  const renderResults = () => {
    if (isLoading) {
      return <SearchResultsSkeleton viewMode={viewMode} />;
    }

    if (error) {
      return (
        <div className="alert alert-danger">
          {t('search.error.loadFailed', 'Failed to load search results')}
        </div>
      );
    }

    if (!data || totalCount === 0) {
      return (
        <SearchEmptyState
          query={searchQuery}
          suggestions={suggestions}
          hasFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      );
    }

    // Show grouped results for "All" tab
    if (activeTab === 'all') {
      return (
        <div className="search-grouped-results">
          {/* Categories Section */}
          {categoriesCount > 0 && (
            <section className="search-results-section mb-5">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="h5 mb-0">
                  {t('search.categories', 'Categories')} ({categoriesCount})
                </h3>
              </div>
              <CategoryResults categories={data.categories} />
            </section>
          )}

          {/* Products Section */}
          {productsCount > 0 && (
            <section className="search-results-section mb-5">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="h5 mb-0">
                  {t('search.products', 'Products')} ({productsCount})
                </h3>
                {productsCount > limit && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => updateTab('products')}
                    className="text-decoration-none"
                  >
                    {t('search.viewAll', 'View all')}
                    <FaArrowRight className={isRTL ? 'me-2' : 'ms-2'} />
                  </Button>
                )}
              </div>
              <ProductsGrid
                products={data.products.data.slice(0, limit)}
                viewMode={viewMode}
              />
            </section>
          )}

          {/* Services Section */}
          {servicesCount > 0 && (
            <section className="search-results-section mb-5">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="h5 mb-0">
                  {t('search.services', 'Services')} ({servicesCount})
                </h3>
                {servicesCount > limit && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => updateTab('services')}
                    className="text-decoration-none"
                  >
                    {t('search.viewAll', 'View all')}
                    <FaArrowRight className={isRTL ? 'me-2' : 'ms-2'} />
                  </Button>
                )}
              </div>
              <ProductsGrid
                products={data.services.data.slice(0, limit)}
                viewMode={viewMode}
              />
            </section>
          )}
        </div>
      );
    }

    // Show products tab results
    if (activeTab === 'products') {
      return (
        <>
          {productsCount > 0 ? (
            <>
              <ProductsGrid products={data.products.data} viewMode={viewMode} />
              <CatalogPagination
                currentPage={currentPage}
                totalPages={data.products.pagination.pages}
                onPageChange={updatePage}
              />
            </>
          ) : (
            <SearchEmptyState
              query={searchQuery}
              suggestions={suggestions}
              hasFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              message={t('search.noProducts', 'No products found')}
            />
          )}
        </>
      );
    }

    // Show services tab results
    if (activeTab === 'services') {
      return (
        <>
          {servicesCount > 0 ? (
            <>
              <ProductsGrid products={data.services.data} viewMode={viewMode} />
              <CatalogPagination
                currentPage={currentPage}
                totalPages={data.services.pagination.pages}
                onPageChange={updatePage}
              />
            </>
          ) : (
            <SearchEmptyState
              query={searchQuery}
              suggestions={suggestions}
              hasFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              message={t('search.noServices', 'No services found')}
            />
          )}
        </>
      );
    }

    return null;
  };

  // Don't show page if no search query
  if (!searchQuery) {
    return (
      <>
        <Navbar />
        <Container className="py-5 text-center">
          <FaSearch className="text-muted mb-3" size={48} />
          <h2>{t('search.enterQuery', 'Enter a search query')}</h2>
          <p className="text-muted">
            {t('search.enterQueryHint', 'Use the search bar above to find products and services')}
          </p>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={`search-page ${isRTL ? 'rtl' : ''}`}>
        <Container fluid="xl" className="py-4">
          {/* Search Bar Section */}
          <Row className="mb-4">
            <Col lg={9} className="offset-lg-3">
              <div className="search-page-header">
                <SearchBar defaultValue={searchQuery} />
                <div className="search-results-summary mt-2">
                  {!isLoading && data && (
                    <p className="text-muted mb-0">
                      {t('search.resultsFor', {
                        query: searchQuery,
                        count: totalCount,
                        defaultValue: `${totalCount} results for "${searchQuery}"`,
                      })}
                    </p>
                  )}
                </div>
              </div>
            </Col>
          </Row>

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
              {/* Tabs */}
              <Nav variant="tabs" className="mb-4" activeKey={activeTab}>
                <Nav.Item>
                  <Nav.Link
                    eventKey="all"
                    onClick={() => updateTab('all')}
                    className="d-flex align-items-center gap-2"
                  >
                    {t('search.tabs.all', 'All')}
                    {!isLoading && totalCount > 0 && (
                      <Badge bg="secondary">{totalCount}</Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    eventKey="products"
                    onClick={() => updateTab('products')}
                    className="d-flex align-items-center gap-2"
                  >
                    {t('search.tabs.products', 'Products')}
                    {!isLoading && productsCount > 0 && (
                      <Badge bg="secondary">{productsCount}</Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    eventKey="services"
                    onClick={() => updateTab('services')}
                    className="d-flex align-items-center gap-2"
                  >
                    {t('search.tabs.services', 'Services')}
                    {!isLoading && servicesCount > 0 && (
                      <Badge bg="secondary">{servicesCount}</Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              {/* Toolbar (only show for non-All tabs) */}
              {activeTab !== 'all' && (
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
                          count: activeTab === 'products' ? productsCount : servicesCount,
                          start: (currentPage - 1) * limit + 1,
                          end: Math.min(
                            currentPage * limit,
                            activeTab === 'products' ? productsCount : servicesCount
                          ),
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
              )}

              {/* Search Results */}
              {renderResults()}
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

export default SearchPage;
