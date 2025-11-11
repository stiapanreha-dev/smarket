import { Card, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import type { Product } from '@/types/catalog';
import { ProductType, formatPrice, getProductPrice } from '@/types/catalog';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'list';
}

/**
 * ProductCard component for displaying product information
 * Supports grid and list layouts with RTL support
 */
export function ProductCard({ product, variant = 'grid' }: ProductCardProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Get product image with fallback
  const getProductImage = (): string => {
    if (product.image_url) return product.image_url;
    if (product.images && product.images.length > 0) return product.images[0];
    return '/placeholder-product.svg'; // Fallback image
  };

  // Get product type badge variant and text
  const getProductTypeBadge = () => {
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
  };

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

  // Handle card click - navigate to product detail
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if button was clicked
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/catalog/${product.id}`);
  };

  // Handle add to cart / book now
  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement add to cart / booking logic
    console.log('Action clicked for product:', product.id);
  };

  const typeBadge = getProductTypeBadge();
  const price = getProductPrice(product);
  const formattedPrice = formatPrice(
    price,
    product.currency,
    i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'ru' ? 'ru-RU' : 'en-US'
  );

  // List variant rendering
  if (variant === 'list') {
    return (
      <Card
        className={`product-card product-card-list cursor-pointer mb-3 ${isRTL ? 'rtl' : ''}`}
        onClick={handleCardClick}
      >
        <div className="row g-0">
          <div className="col-md-3">
            <Card.Img
              variant="top"
              src={getProductImage()}
              alt={product.title}
              className="product-card-image-list"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-product.svg';
              }}
            />
          </div>
          <div className="col-md-9">
            <Card.Body className="d-flex flex-column h-100">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <Card.Title className="product-card-title mb-0">
                  {truncateTitle(product.title, 80)}
                </Card.Title>
                <Badge bg={typeBadge.variant} className="ms-2">
                  {typeBadge.text}
                </Badge>
              </div>

              {product.description && (
                <Card.Text className="text-muted small mb-2">
                  {truncateTitle(product.description, 150)}
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
                >
                  {getButtonText()}
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
    >
      <div className="product-card-image-wrapper">
        <Card.Img
          variant="top"
          src={getProductImage()}
          alt={product.title}
          className="product-card-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-product.svg';
          }}
        />
        <Badge
          bg={typeBadge.variant}
          className="product-type-badge position-absolute top-0 m-2"
          style={{ [isRTL ? 'left' : 'right']: '8px' }}
        >
          {typeBadge.text}
        </Badge>
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
        >
          {getButtonText()}
        </Button>
      </Card.Body>
    </Card>
  );
}

export default ProductCard;
