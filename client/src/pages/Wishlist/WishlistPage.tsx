import { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Button, Alert, Form, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaHeart, FaArrowLeft, FaShare, FaFilter, FaSort } from 'react-icons/fa';
import toast from 'react-hot-toast';
import {
  useWishlistItems,
  useLoadWishlist,
  useRemoveFromWishlist,
  useWishlistLoading,
  useWishlistError,
  useClearWishlistError,
} from '@/store/wishlistStore';
import { useAddToCart } from '@/store/cartStore';
import { wishlistApi } from '@/api';
import { ProductType } from '@/types/catalog';
import { Navbar, Footer } from '@/components/layout';
import { WishlistCard } from './components/WishlistCard';
import { EmptyWishlist } from './components/EmptyWishlist';
import { RemoveFromWishlistModal } from './components/RemoveFromWishlistModal';
import './WishlistPage.css';

/**
 * Wishlist Page Component
 *
 * Features:
 * - Display wishlist items in grid layout
 * - Remove from wishlist
 * - Add to cart
 * - Move to cart (add to cart + remove from wishlist)
 * - Share wishlist (copy link)
 * - Filter by product type and price range
 * - Sort by added date and price
 * - Empty state
 * - Confirmation modal for removal
 * - Responsive design (4 columns on desktop, 2 on tablet, 1 on mobile)
 * - Multi-language support with RTL
 */
export function WishlistPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Wishlist state
  const items = useWishlistItems();
  const loadWishlist = useLoadWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const isLoading = useWishlistLoading();
  const error = useWishlistError();
  const clearError = useClearWishlistError();

  // Cart actions
  const addToCart = useAddToCart();

  // Local state
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);
  const [isMovingToCart, setIsMovingToCart] = useState<string | null>(null);

  // Filter and sort state
  const [selectedType, setSelectedType] = useState<ProductType | 'all'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [sortBy, setSortBy] = useState<'date' | 'price-asc' | 'price-desc'>('date');
  const [showFilters, setShowFilters] = useState(false);

  // Load wishlist on mount
  useEffect(() => {
    loadWishlist().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

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
          // Sort by date added (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'price-asc':
          // Sort by price (lowest first)
          const priceA = a.product?.basePriceMinor || 0;
          const priceB = b.product?.basePriceMinor || 0;
          return priceA - priceB;
        case 'price-desc':
          // Sort by price (highest first)
          const priceA2 = a.product?.basePriceMinor || 0;
          const priceB2 = b.product?.basePriceMinor || 0;
          return priceB2 - priceA2;
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, selectedType, priceRange, sortBy]);

  // Handle remove from wishlist
  const handleRemove = async () => {
    if (!itemToRemove) return;

    setIsRemoving(true);
    try {
      await removeFromWishlist(itemToRemove);
      toast.success(t('wishlist.removed') || 'Removed from wishlist');
      setItemToRemove(null);
    } catch (err) {
      toast.error(t('wishlist.removeError') || 'Failed to remove from wishlist');
      console.error('Failed to remove from wishlist:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  // Handle add to cart
  const handleAddToCart = async (productId: string) => {
    setIsAddingToCart(productId);
    try {
      await addToCart({ productId, quantity: 1 });
      toast.success(t('cart.added') || 'Added to cart');
    } catch (err) {
      toast.error(t('cart.addError') || 'Failed to add to cart');
      console.error('Failed to add to cart:', err);
    } finally {
      setIsAddingToCart(null);
    }
  };

  // Handle move to cart (add to cart + remove from wishlist)
  const handleMoveToCart = async (productId: string) => {
    setIsMovingToCart(productId);
    try {
      await addToCart({ productId, quantity: 1 });
      await removeFromWishlist(productId);
      toast.success(t('wishlist.movedToCart') || 'Moved to cart');
    } catch (err) {
      toast.error(t('wishlist.moveError') || 'Failed to move to cart');
      console.error('Failed to move to cart:', err);
    } finally {
      setIsMovingToCart(null);
    }
  };

  // Handle share wishlist
  const handleShare = async () => {
    try {
      // Generate share token
      const { shareToken } = await wishlistApi.generateShareToken();

      // Create shareable URL
      const shareUrl = `${window.location.origin}/wishlist/shared/${shareToken}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('wishlist.linkCopied') || 'Wishlist link copied to clipboard');
    } catch (error) {
      console.error('Failed to generate share link:', error);
      toast.error(t('wishlist.linkCopyError') || 'Failed to copy link');
    }
  };

  // Empty wishlist state
  if (!isLoading && items.length === 0) {
    return (
      <>
        <Navbar />
        <div className={`wishlist-page ${isRTL ? 'rtl' : ''}`}>
          <Container className="py-4">
            <EmptyWishlist />
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
                  {t('wishlist.title', 'My Wishlist')}
                </h1>
                <p className="text-muted mb-0">
                  {t('wishlist.itemsCount', {
                    count: filteredAndSortedItems.length,
                    defaultValue: '{{count}} items',
                  })}
                </p>
              </div>
              <div className="d-flex gap-2">
                <Button variant="outline-primary" size="sm" onClick={handleShare}>
                  <FaShare className={isRTL ? 'ms-2' : 'me-2'} />
                  {t('wishlist.share', 'Share Wishlist')}
                </Button>
                <Link to="/catalog">
                  <Button variant="outline-secondary" size="sm">
                    <FaArrowLeft className={isRTL ? 'ms-2' : 'me-2'} />
                    {t('wishlist.continueShopping', 'Continue Shopping')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="danger" dismissible onClose={clearError} className="mb-4">
              {error}
            </Alert>
          )}

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

                {/* Filters (Visible on desktop or when toggled on mobile) */}
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
                    onRemove={() => setItemToRemove(item.productId)}
                    onAddToCart={() => handleAddToCart(item.productId)}
                    onMoveToCart={() => handleMoveToCart(item.productId)}
                    isAddingToCart={isAddingToCart === item.productId}
                    isMovingToCart={isMovingToCart === item.productId}
                    disabled={isLoading || !!isAddingToCart || !!isMovingToCart}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </div>
      <Footer />

      {/* Remove Confirmation Modal */}
      <RemoveFromWishlistModal
        show={!!itemToRemove}
        onHide={() => setItemToRemove(null)}
        onConfirm={handleRemove}
        isLoading={isRemoving}
      />
    </>
  );
}

export default WishlistPage;
