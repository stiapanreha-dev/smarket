import { Card, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { toast } from 'react-hot-toast';
import { memo, useCallback, useMemo, useState } from 'react';
import type { Product } from '@/types/catalog';
import { ProductType, formatPrice, getProductPrice } from '@/types/catalog';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { usePrefetchProduct } from '@/hooks/useCatalog';
import { extractTextFromEditorJS } from '@/utils/editorjs';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'list';
}

/**
 * ProductCard component for displaying product information
 * Supports grid and list layouts with RTL support
 * Optimized with React.memo to prevent unnecessary re-renders
 * Prefetches product details on hover for instant navigation
 */
function ProductCardComponent({ product, variant = 'grid' }: ProductCardProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Local state for loading
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Auth check
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Wishlist functionality
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  // Cart functionality
  const { addItem } = useCartStore();

  // Prefetch product details on hover for instant navigation
  const prefetchProduct = usePrefetchProduct();

  // Get product image with fallback - memoized to avoid recalculation
  const productImage = useMemo((): string => {
    if (product.image_url) return product.image_url;
    if (product.images && product.images.length > 0) return product.images[0];
    return '/placeholder-product.svg'; // Fallback image
  }, [product.image_url, product.images]);

  // Get product type badge variant and text - memoized
  const typeBadge = useMemo(() => {
    switch (product.type) {
      case ProductType.PHYSICAL:
        return { variant: 'primary', text: t('product.type.physical') };
      case ProductType.SERVICE:
        return { variant: 'success', text: t('product.type.service') };
      case ProductType.COURSE:
        return { variant: 'info', text: t('product.type.course') };
      default:
        return { variant: 'secondary', text: product.type };
    }
  }, [product.type, t]);

  // Render rating stars
  const renderRating = (rating: number | null) => {
    if (!rating) return null;

    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-warning" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-warning" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-warning" />);
      }
    }

    return (
      <div className="product-rating d-flex align-items-center gap-1">
        {stars}
        <span className="ms-1 text-muted small">
          ({product.review_count || 0})
        </span>
      </div>
    );
  };

  // Truncate long product names
  const truncateTitle = (title: string, maxLength: number = 60): string => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  // Get button text based on product type
  const getButtonText = (): string => {
    if (product.type === ProductType.SERVICE) {
      return t('product.bookNow');
    }
    return t('product.addToCart');
  };

  // Handle card click - navigate to product detail - memoized with useCallback
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't navigate if button was clicked
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/product/${product.id}`);
  }, [navigate, product.id]);

  // Handle add to cart / book now - memoized with useCallback
  const handleAction = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (product.type === ProductType.SERVICE) {
      // For services, navigate to product page for booking
      navigate(`/product/${product.id}`);
      return;
    }

    // Add to cart for physical products and courses
    setIsAddingToCart(true);
    try {
      await addItem({
        productId: product.id,
        variantId: product.variants?.[0]?.id || '', // Use first variant or empty string
        quantity: 1,
      }, product, product.variants?.[0]);

      toast.success(t('product.addedToCart') || 'Added to cart');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : t('product.addToCartError') || 'Failed to add to cart'
      );
    } finally {
      setIsAddingToCart(false);
    }
  }, [product, addItem, navigate, t]);

  // Handle wishlist toggle - memoized with useCallback
  const handleWishlistToggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Redirect to login with return URL to come back after login
      const returnUrl = encodeURIComponent(`/product/${product.id}`);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    try {
      if (inWishlist) {
        await removeFromWishlist(product.id);
        toast.success(t('wishlist.removed') || 'Removed from wishlist');
      } else {
        await addToWishlist(product.id);
        toast.success(t('wishlist.added') || 'Added to wishlist');
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('wishlist.error') || 'Failed to update wishlist'
      );
    }
  }, [isAuthenticated, inWishlist, product.id, removeFromWishlist, addToWishlist, t, navigate]);

  // Calculate price and formatted price - memoized
  const price = useMemo(() => getProductPrice(product), [product]);
  const formattedPrice = useMemo(() => formatPrice(
    price,
    product.currency,
    i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'ru' ? 'ru-RU' : 'en-US'
  ), [price, product.currency, i18n.language]);

  // Extract plain text from EditorJS description - memoized
  const descriptionText = useMemo(() => {
    if (!product.description) return '';
    return extractTextFromEditorJS(product.description, 150);
  }, [product.description]);

  // List variant rendering
  if (variant === 'list') {
    return (
      <Card
        className={`product-card product-card-list cursor-pointer mb-3 ${isRTL ? 'rtl' : ''}`}
        onClick={handleCardClick}
        onMouseEnter={() => prefetchProduct(product.id)}
      >
        <div className="row g-0">
          <div className="col-md-3">
            <div className="position-relative">
              <Card.Img
                variant="top"
                src={productImage}
                alt={product.title}
                className="product-card-image-list"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                }}
              />
              <Button
                variant="light"
                size="sm"
                className="position-absolute top-0 m-2 rounded-circle p-2 wishlist-btn"
                style={{ [isRTL ? 'right' : 'left']: '8px' }}
                onClick={handleWishlistToggle}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {inWishlist ? (
                  <AiFillHeart size={20} className="text-danger" />
                ) : (
                  <AiOutlineHeart size={20} />
                )}
              </Button>
            </div>
          </div>
          <div className="col-md-9">
            <Card.Body className="d-flex flex-column h-100">
              <Card.Title className="product-card-title mb-2">
                {truncateTitle(product.title, 80)}
              </Card.Title>

              {descriptionText && (
                <Card.Text className="text-muted small mb-2">
                  {descriptionText}
                </Card.Text>
              )}

              <div className="d-flex align-items-center gap-3 mb-3">
                {product.rating && renderRating(product.rating)}
                {product.sales_count > 0 && (
                  <span className="text-muted small">
                    {t('product.sold', { count: product.sales_count })}
                  </span>
                )}
              </div>

              <div className="mt-auto d-flex justify-content-between align-items-center">
                <div className="product-card-price">
                  {formattedPrice}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAction}
                  disabled={isAddingToCart}
                >
                  {isAddingToCart ? t('product.adding') || 'Adding...' : getButtonText()}
                </Button>
              </div>
            </Card.Body>
          </div>
        </div>
      </Card>
    );
  }

  // Grid variant rendering (default)
  return (
    <Card
      className={`product-card product-card-grid cursor-pointer h-100 ${isRTL ? 'rtl' : ''}`}
      onClick={handleCardClick}
      onMouseEnter={() => prefetchProduct(product.id)}
    >
      <div className="product-card-image-wrapper">
        <Card.Img
          variant="top"
          src={productImage}
          alt={product.title}
          className="product-card-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-product.svg';
          }}
        />
        <Button
          variant="light"
          size="sm"
          className="position-absolute top-0 m-2 rounded-circle p-2 wishlist-btn"
          style={{ [isRTL ? 'right' : 'left']: '8px' }}
          onClick={handleWishlistToggle}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {inWishlist ? (
            <AiFillHeart size={20} className="text-danger" />
          ) : (
            <AiOutlineHeart size={20} />
          )}
        </Button>
      </div>

      <Card.Body className="d-flex flex-column">
        <Card.Title className="product-card-title mb-2">
          {truncateTitle(product.title)}
        </Card.Title>

        <div className="mb-2">
          {product.rating && renderRating(product.rating)}
        </div>

        <div className="product-card-price mb-3">
          {formattedPrice}
        </div>

        <Button
          variant="primary"
          className="mt-auto w-100"
          size="sm"
          onClick={handleAction}
          disabled={isAddingToCart}
        >
          {isAddingToCart ? t('product.adding') || 'Adding...' : getButtonText()}
        </Button>
      </Card.Body>
    </Card>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const ProductCard = memo(ProductCardComponent);
export default ProductCard;
