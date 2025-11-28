import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaShoppingCart, FaExchangeAlt } from 'react-icons/fa';
import type { WishlistItem } from '@/types/wishlist';
import { formatPrice } from '@/types/catalog';
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
 * Displays a product card in the wishlist with:
 * - Product image, title, and price
 * - Remove from wishlist button (X)
 * - Add to Cart button
 * - Move to Cart button (add to cart + remove from wishlist)
 * - Product type badge
 */
export function WishlistCard({
  item,
  onRemove,
  onAddToCart,
  onMoveToCart,
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
    return '/placeholder-product.svg'; // Fallback image
  };

  // Truncate long product names
  const truncateTitle = (title: string, maxLength: number = 60): string => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  // Format price (convert minor units to major units first)
  const formattedPrice = product?.basePriceMinor !== null && product?.basePriceMinor !== undefined
    ? formatPrice(
        product.basePriceMinor / 100,
        product.currency,
        i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'ru' ? 'ru-RU' : 'en-US'
      )
    : t('product.priceUnavailable', 'Price unavailable');

  // Handle card click - navigate to product detail
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if button was clicked
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (product?.id) {
      navigate(`/product/${product.id}`);
    }
  };

  return (
    <Card
      className={`wishlist-card cursor-pointer h-100 ${isRTL ? 'rtl' : ''}`}
      onClick={handleCardClick}
    >
      <div className="wishlist-card-image-wrapper">
        <Card.Img
          variant="top"
          src={getProductImage()}
          alt={product?.title || 'Product'}
          className="wishlist-card-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-product.svg';
          }}
        />
        {!isShared && onRemove && (
          <Button
            variant="light"
            size="sm"
            className="remove-btn position-absolute top-0 m-2 rounded-circle p-2"
            style={{ [isRTL ? 'right' : 'left']: '8px' }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            disabled={disabled}
            aria-label="Remove from wishlist"
          >
            <FaTimes size={16} className="text-danger" />
          </Button>
        )}
      </div>

      <Card.Body className="d-flex flex-column">
        <Card.Title className="wishlist-card-title mb-2">
          {truncateTitle(product?.title || 'Unknown Product')}
        </Card.Title>

        <div className="wishlist-card-price mb-3 fw-bold text-primary">
          {formattedPrice}
        </div>

        {/* Added date */}
        <div className="text-muted small mb-3">
          {t('wishlist.addedOn', 'Added on')}{' '}
          {new Date(item.createdAt).toLocaleDateString(
            i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'ru' ? 'ru-RU' : 'en-US',
            {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }
          )}
        </div>

        {/* Action buttons - only show if not shared */}
        {!isShared && (
          <div className="mt-auto d-flex flex-column gap-2">
            {/* Add to Cart button */}
            {onAddToCart && (
              <Button
                variant="outline-primary"
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
                    {t('cart.adding', 'Adding...')}
                  </>
                ) : (
                  <>
                    <FaShoppingCart className={isRTL ? 'ms-2' : 'me-2'} />
                    {t('wishlist.addToCart', 'Add to Cart')}
                  </>
                )}
              </Button>
            )}

            {/* Move to Cart button */}
            {onMoveToCart && (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToCart();
                }}
                disabled={disabled || isAddingToCart || isMovingToCart}
              >
                {isMovingToCart ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    {t('wishlist.moving', 'Moving...')}
                  </>
                ) : (
                  <>
                    <FaExchangeAlt className={isRTL ? 'ms-2' : 'me-2'} />
                    {t('wishlist.moveToCart', 'Move to Cart')}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default WishlistCard;
