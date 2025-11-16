import { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Alert, Form, Card, Button } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaHeart, FaFilter, FaSort, FaArrowLeft } from 'react-icons/fa';
import { wishlistApi } from '@/api';
import { ProductType } from '@/types';
import type { WishlistItem } from '@/types/wishlist';
import { Navbar, Footer } from '@/components/layout';
import { WishlistCard } from './components/WishlistCard';
import './WishlistPage.css';

/**
 * Shared Wishlist Page Component
 *
 * Public page for viewing a shared wishlist by token
 * - No authentication required
 * - Read-only view
 * - Can add items to own cart
 */
export function SharedWishlistPage() {
  const { token } = useParams<{ token: string }>();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // State
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort state
  const [selectedType, setSelectedType] = useState<ProductType | 'all'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [sortBy, setSortBy] = useState<'date' | 'price-asc' | 'price-desc'>('date');
  const [showFilters, setShowFilters] = useState(false);

  // Load shared wishlist
  useEffect(() => {
    const loadSharedWishlist = async () => {
      if (!token) {
        setError('Invalid share link');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const wishlist = await wishlistApi.getSharedWishlist(token);
        setItems(wishlist.items);
        setError(null);
      } catch (err) {
        console.error('Failed to load shared wishlist:', err);
        setError('Failed to load wishlist. The link may be invalid or expired.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSharedWishlist();
  }, [token]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...items];

    // Filter by product type
    if (selectedType !== 'all') {
      filtered = filtered.filter((item) => item.product?.type === selectedType);
    }

    // Filter by price range
    filtered = filtered.filter((item) => {
      if (!item.product?.basePriceMinor) return true;
      const price = item.product.basePriceMinor / 100;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'price-asc':
          const priceA = a.product?.basePriceMinor || 0;
          const priceB = b.product?.basePriceMinor || 0;
          return priceA - priceB;
        case 'price-desc':
          const priceA2 = a.product?.basePriceMinor || 0;
          const priceB2 = b.product?.basePriceMinor || 0;
          return priceB2 - priceA2;
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, selectedType, priceRange, sortBy]);

  // Error state
  if (error) {
    return (
      <>
        <Navbar />
        <div className={`wishlist-page ${isRTL ? 'rtl' : ''}`}>
          <Container className="py-4">
            <Alert variant="danger">
              <Alert.Heading>Error</Alert.Heading>
              <p>{error}</p>
              <hr />
              <div className="d-flex justify-content-end">
                <Link to="/catalog">
                  <Button variant="outline-danger">
                    <FaArrowLeft className={isRTL ? 'ms-2' : 'me-2'} />
                    Go to Catalog
                  </Button>
                </Link>
              </div>
            </Alert>
          </Container>
        </div>
        <Footer />
      </>
    );
  }

  // Empty wishlist state
  if (!isLoading && items.length === 0) {
    return (
      <>
        <Navbar />
        <div className={`wishlist-page ${isRTL ? 'rtl' : ''}`}>
          <Container className="py-4">
            <Card className="text-center py-5">
              <Card.Body>
                <FaHeart size={64} className="text-muted mb-3" />
                <h3>{t('wishlist.empty', 'This wishlist is empty')}</h3>
                <p className="text-muted">{t('wishlist.emptyShared', 'The owner hasn\'t added any items yet.')}</p>
                <Link to="/catalog">
                  <Button variant="primary" className="mt-3">
                    <FaArrowLeft className={isRTL ? 'ms-2' : 'me-2'} />
                    {t('catalog.browseCatalog', 'Browse Catalog')}
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Container>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={`wishlist-page ${isRTL ? 'rtl' : ''}`}>
        <Container className="py-4">
          {/* Header */}
          <div className="wishlist-header mb-4">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div>
                <h1 className="mb-2">
                  <FaHeart className="me-2 text-danger" />
                  {t('wishlist.sharedTitle', 'Shared Wishlist')}
                </h1>
                <p className="text-muted mb-0">
                  {t('wishlist.itemsCount', {
                    count: filteredAndSortedItems.length,
                    defaultValue: '{{count}} items',
                  })}
                </p>
              </div>
              <div>
                <Link to="/catalog">
                  <Button variant="outline-secondary" size="sm">
                    <FaArrowLeft className={isRTL ? 'ms-2' : 'me-2'} />
                    {t('wishlist.continueShopping', 'Continue Shopping')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Filter and Sort Bar */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="g-3 align-items-end">
                {/* Filter Toggle (Mobile) */}
                <Col xs={12} className="d-lg-none">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-100"
                  >
                    <FaFilter className={isRTL ? 'ms-2' : 'me-2'} />
                    {t('wishlist.filters', 'Filters')}
                  </Button>
                </Col>

                {/* Filters */}
                <div className={`col-12 ${!showFilters ? 'd-none d-lg-block' : ''}`}>
                  <Row className="g-3">
                    {/* Product Type Filter */}
                    <Col xs={12} md={4}>
                      <Form.Group>
                        <Form.Label className="small text-muted mb-1">
                          {t('wishlist.productType', 'Product Type')}
                        </Form.Label>
                        <Form.Select
                          size="sm"
                          value={selectedType}
                          onChange={(e) => setSelectedType(e.target.value as ProductType | 'all')}
                        >
                          <option value="all">{t('wishlist.allTypes', 'All Types')}</option>
                          <option value={ProductType.PHYSICAL}>
                            {t('product.type.physical', 'Physical')}
                          </option>
                          <option value={ProductType.SERVICE}>
                            {t('product.type.service', 'Service')}
                          </option>
                          <option value={ProductType.COURSE}>
                            {t('product.type.course', 'Course')}
                          </option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    {/* Price Range Filter */}
                    <Col xs={12} md={4}>
                      <Form.Group>
                        <Form.Label className="small text-muted mb-1">
                          {t('wishlist.priceRange', 'Price Range')}
                        </Form.Label>
                        <div className="d-flex gap-2 align-items-center">
                          <Form.Control
                            type="number"
                            size="sm"
                            placeholder="Min"
                            value={priceRange[0]}
                            onChange={(e) =>
                              setPriceRange([Number(e.target.value), priceRange[1]])
                            }
                          />
                          <span>-</span>
                          <Form.Control
                            type="number"
                            size="sm"
                            placeholder="Max"
                            value={priceRange[1]}
                            onChange={(e) =>
                              setPriceRange([priceRange[0], Number(e.target.value)])
                            }
                          />
                        </div>
                      </Form.Group>
                    </Col>

                    {/* Sort By */}
                    <Col xs={12} md={4}>
                      <Form.Group>
                        <Form.Label className="small text-muted mb-1">
                          <FaSort className={isRTL ? 'ms-1' : 'me-1'} />
                          {t('wishlist.sortBy', 'Sort By')}
                        </Form.Label>
                        <Form.Select
                          size="sm"
                          value={sortBy}
                          onChange={(e) =>
                            setSortBy(e.target.value as 'date' | 'price-asc' | 'price-desc')
                          }
                        >
                          <option value="date">{t('wishlist.sortDate', 'Date Added')}</option>
                          <option value="price-asc">
                            {t('wishlist.sortPriceAsc', 'Price: Low to High')}
                          </option>
                          <option value="price-desc">
                            {t('wishlist.sortPriceDesc', 'Price: High to Low')}
                          </option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Row>
            </Card.Body>
          </Card>

          {/* Products Grid */}
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredAndSortedItems.length === 0 ? (
            <Card className="text-center py-5">
              <Card.Body>
                <p className="text-muted mb-0">
                  {t('wishlist.noResults', 'No items match your filters')}
                </p>
              </Card.Body>
            </Card>
          ) : (
            <Row className="wishlist-grid g-4">
              {filteredAndSortedItems.map((item) => (
                <Col key={item.id} xs={12} sm={6} lg={3}>
                  <WishlistCard
                    item={item}
                    // Shared wishlist is read-only for actions
                    onRemove={undefined}
                    onAddToCart={undefined}
                    onMoveToCart={undefined}
                    isAddingToCart={false}
                    isMovingToCart={false}
                    disabled={false}
                    isShared={true}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </div>
      <Footer />
    </>
  );
}

export default SharedWishlistPage;
