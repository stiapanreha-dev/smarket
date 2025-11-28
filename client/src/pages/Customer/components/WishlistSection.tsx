/**
 * Wishlist Section Component
 *
 * Embedded wishlist view for customer dashboard
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Button, Spinner, Form, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaHeart, FaShare, FaFilter, FaSort } from 'react-icons/fa';
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
import { WishlistCard } from '@/pages/Wishlist/components/WishlistCard';
import { EmptyWishlist } from '@/pages/Wishlist/components/EmptyWishlist';
import { RemoveFromWishlistModal } from '@/pages/Wishlist/components/RemoveFromWishlistModal';

type SortOption = 'newest' | 'oldest' | 'price-asc' | 'price-desc';

export const WishlistSection: React.FC = () => {
  const { t } = useTranslation();

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

  // Filters and sorting
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterType, setFilterType] = useState<ProductType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Load wishlist on mount
  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((item) => item.product?.product_type === filterType);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
        );
        break;
      case 'oldest':
        result.sort(
          (a, b) =>
            new Date(a.added_at).getTime() - new Date(b.added_at).getTime()
        );
        break;
      case 'price-asc':
        result.sort((a, b) => (a.product?.price || 0) - (b.product?.price || 0));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.product?.price || 0) - (a.product?.price || 0));
        break;
    }

    return result;
  }, [items, filterType, sortBy]);

  // Handlers
  const handleAddToCart = async (productId: string) => {
    try {
      setIsAddingToCart(productId);
      await addToCart({ productId, quantity: 1 });
      toast.success(t('customer:wishlist.toast.addedToCart'));
    } catch (err) {
      toast.error(t('customer:wishlist.toast.failedToAdd'));
    } finally {
      setIsAddingToCart(null);
    }
  };

  const handleMoveToCart = async (productId: string, wishlistItemId: string) => {
    try {
      setIsMovingToCart(wishlistItemId);
      await addToCart({ productId, quantity: 1 });
      await removeFromWishlist(wishlistItemId);
      toast.success(t('customer:wishlist.toast.movedToCart'));
    } catch (err) {
      toast.error(t('customer:wishlist.toast.failedToMove'));
    } finally {
      setIsMovingToCart(null);
    }
  };

  const handleRemove = async () => {
    if (!itemToRemove) return;
    try {
      setIsRemoving(true);
      await removeFromWishlist(itemToRemove);
      toast.success(t('customer:wishlist.toast.removed'));
    } catch (err) {
      toast.error(t('customer:wishlist.toast.failedToRemove'));
    } finally {
      setIsRemoving(false);
      setItemToRemove(null);
    }
  };

  const handleShare = async () => {
    try {
      const response = await wishlistApi.generateShareToken();
      const shareUrl = `${window.location.origin}/wishlist/shared/${response.shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('customer:wishlist.toast.shareLinkCopied'));
    } catch (err) {
      toast.error(t('customer:wishlist.toast.failedToShare'));
    }
  };

  return (
    <>
      <div className="section-header">
        <h2>{t('customer:wishlist.title')}</h2>
        <div className="d-flex gap-2">
          {items.length > 0 && (
            <>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter className="me-1" />
                {t('customer:wishlist.filter')}
              </Button>
              <Button variant="outline-primary" size="sm" onClick={handleShare}>
                <FaShare className="me-1" />
                {t('customer:wishlist.share')}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="section-content">
        {/* Filters */}
        {showFilters && items.length > 0 && (
          <Card className="mb-3">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small text-muted">{t('customer:wishlist.productType')}</Form.Label>
                    <Form.Select
                      size="sm"
                      value={filterType}
                      onChange={(e) =>
                        setFilterType(e.target.value as ProductType | 'all')
                      }
                    >
                      <option value="all">{t('customer:wishlist.allTypes')}</option>
                      <option value="physical">{t('productType.physical')}</option>
                      <option value="digital">{t('productType.digital')}</option>
                      <option value="service">{t('productType.service')}</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small text-muted">{t('customer:wishlist.sortBy')}</Form.Label>
                    <Form.Select
                      size="sm"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                    >
                      <option value="newest">{t('customer:wishlist.newestFirst')}</option>
                      <option value="oldest">{t('customer:wishlist.oldestFirst')}</option>
                      <option value="price-asc">{t('customer:wishlist.priceLowToHigh')}</option>
                      <option value="price-desc">{t('customer:wishlist.priceHighToLow')}</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4} className="text-muted small mt-3 mt-md-0">
                  {filteredItems.length} {filteredItems.length === 1 ? t('customer:wishlist.item') : t('customer:wishlist.items')}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="loading-spinner">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : items.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <Row>
            {filteredItems.map((item) => (
              <Col key={item.id} lg={4} md={6} className="mb-4">
                <WishlistCard
                  item={item}
                  onRemove={() => setItemToRemove(item.id)}
                  onAddToCart={() => handleAddToCart(item.product_id)}
                  onMoveToCart={() => handleMoveToCart(item.product_id, item.id)}
                  isAddingToCart={isAddingToCart === item.product_id}
                  isMovingToCart={isMovingToCart === item.id}
                />
              </Col>
            ))}
          </Row>
        )}

        {/* Remove Confirmation Modal */}
        <RemoveFromWishlistModal
          show={!!itemToRemove}
          onHide={() => setItemToRemove(null)}
          onConfirm={handleRemove}
          isLoading={isRemoving}
        />
      </div>
    </>
  );
};

export default WishlistSection;
