import { Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaShoppingCart } from 'react-icons/fa';
import { AiFillHeart } from 'react-icons/ai';
import type { WishlistItem } from '@/types/wishlist';
import { formatPrice, ProductType } from '@/types/catalog';
import './WishlistCard.css';

interface WishlistCardProps {
  item: WishlistItem;
  onRemove?: () => void;
  onAddToCart?: () => void;
  onMoveToCart?: () => void;
  isAddingToCart?: boolean;
  isMovingToCart?: boolean;
  disabled?: boolean;
  isShared?: boolean; // True if viewing shared wishlist (read-only)
}

/**
 * Wishlist Card Component
 *
 * Displays a product card in the wishlist matching the catalog ProductCard style
 */
export function WishlistCard({
  item,
  onRemove,
  onAddToCart,
  isAddingToCart = false,
  isMovingToCart = false,
  disabled = false,
  isShared = false,
}: WishlistCardProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const product = item.product;

  // Get product image with fallback
  const getProductImage = (): string => {
    if (product?.imageUrl) return product.imageUrl;
    return '/placeholder-product.svg';
  };

  // Truncate long product names
  const truncateTitle = (title: string, maxLength: number = 60): string => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  // Get product type badge
  const getProductTypeBadge = () => {
    switch (product?.type) {
      case ProductType.PHYSICAL:
        return { variant: 'primary', text: t('product.type.physical') };
      case ProductType.SERVICE:
        return { variant: 'success', text: t('product.type.service') };
      case ProductType.COURSE:
        return { variant: 'info', text: t('product.type.course') };
      default:
        return null;
    }
  };

  const typeBadge = getProductTypeBadge();

  // Format price (convert from minor units to major units)
  const formattedPrice = product?.basePriceMinor !== null && product?.basePriceMinor !== undefined
    ? formatPrice(
        product.basePriceMinor / 100,
        product.currency,
        i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'ru' ? 'ru-RU' : 'en-US'
      )
    : t('product.priceUnavailable', 'Price unavailable');

  // Handle card click - navigate to product detail (prefer slug over id)
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (product?.slug || product?.id) {
      navigate(`/product/${product.slug || product.id}`);
    }
  };

  return (
    <Card
      className={`product-card product-card-grid cursor-pointer h-100 ${isRTL ? 'rtl' : ''}`}
      onClick={handleCardClick}
    >
      <div className="product-card-image-wrapper">
        <Card.Img
          variant="top"
          src={getProductImage()}
          alt={product?.title || 'Product'}
          className="product-card-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-product.svg';
          }}
        />
        {/* Wishlist button (heart) - shown as filled since item is in wishlist */}
        {!isShared && onRemove && (
          <Button
            variant="light"
            size="sm"
            className="position-absolute top-0 m-2 rounded-circle p-2 wishlist-btn"
            style={{ [isRTL ? 'right' : 'left']: '8px' }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            disabled={disabled}
            aria-label="Remove from wishlist"
          >
            <AiFillHeart size={20} className="text-danger" />
          </Button>
        )}
        {/* Product type badge */}
        {typeBadge && (
          <Badge
            bg={typeBadge.variant}
            className="position-absolute top-0 m-2"
            style={{ [isRTL ? 'left' : 'right']: '8px' }}
          >
            {typeBadge.text}
          </Badge>
        )}
      </div>

      <Card.Body className="d-flex flex-column">
        <Card.Title className="product-card-title mb-2">
          {truncateTitle(product?.title || 'Unknown Product')}
        </Card.Title>

        <div className="product-card-price mb-3">
          {formattedPrice}
        </div>

        {/* Add to Cart button */}
        {!isShared && onAddToCart && (
          <Button
            variant="primary"
            className="mt-auto w-100"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            disabled={disabled || isAddingToCart || isMovingToCart}
          >
            {isAddingToCart ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                {t('product.adding') || 'Adding...'}
              </>
            ) : (
              <>
                <FaShoppingCart className={isRTL ? 'ms-2' : 'me-2'} />
                {t('product.addToCart')}
              </>
            )}
          </Button>
        )}
      </Card.Body>
    </Card>
  );
}

export default WishlistCard;
