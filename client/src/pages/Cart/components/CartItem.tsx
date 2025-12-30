import { useState } from 'react';
import { Card, Row, Col, Button, Form, Badge, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaTrash, FaMinus, FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import type { CartItemWithProduct } from '@/types/cart';
import { formatCartPrice } from '@/types/cart';
import { LoadingSpinner } from '@/components/common';

interface CartItemProps {
  item: CartItemWithProduct;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}

/**
 * Cart Item Component
 *
 * Displays a single cart item with:
 * - Product image and name
 * - Price and quantity
 * - Quantity controls (+/- buttons)
 * - Remove button
 * - Stock warning
 * - Subtotal calculation
 */
export function CartItem({ item, onQuantityChange, onRemove, disabled = false }: CartItemProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [isUpdating, setIsUpdating] = useState(false);

  // Get product details
  const product = item.product;
  const variant = item.variant;
  const productName = product?.title || t('cart.unknownProduct', 'Unknown Product');
  const variantName = variant?.title || '';

  // Get product image
  const productImage = product?.image_url || product?.images?.[0] || '/placeholder-product.png';

  // Check stock availability
  const availableStock = variant?.inventory_quantity || 0;
  const isLowStock = availableStock > 0 && availableStock < 10;
  const isOutOfStock = availableStock === 0;
  const exceedsStock = item.quantity > availableStock;

  // Handle quantity change
  const handleQuantityChange = async (newQuantity: number) => {
    if (isUpdating || disabled) return;
    if (newQuantity === item.quantity) return;

    setIsUpdating(true);
    try {
      await onQuantityChange(item.id, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle direct input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 999) {
      handleQuantityChange(value);
    }
  };

  return (
    <Card className={`cart-item mb-3 ${disabled || isUpdating ? 'loading' : ''}`}>
      <Card.Body>
        <Row className="align-items-center g-3">
          {/* Product Image */}
          <Col xs={12} sm={3} md={2}>
            <Link to={`/product/${product?.slug || item.productId}`} className="cart-item-image-link">
              <Image
                src={productImage}
                alt={productName}
                className="cart-item-image"
                rounded
                fluid
              />
            </Link>
          </Col>

          {/* Product Info */}
          <Col xs={12} sm={9} md={4}>
            <div className="cart-item-info">
              <Link
                to={`/product/${product?.slug || item.productId}`}
                className="cart-item-name text-decoration-none"
              >
                <h6 className="mb-1">{productName}</h6>
              </Link>
              {variantName && (
                <p className="text-muted mb-1 small">
                  {t('cart.variant', 'Variant')}: {variantName}
                </p>
              )}

              {/* Stock Warning */}
              {exceedsStock && (
                <Badge bg="danger" className="mt-2">
                  <FaExclamationTriangle className="me-1" />
                  {t('cart.exceedsStock', {
                    available: availableStock,
                    defaultValue: 'Only {{available}} available',
                  })}
                </Badge>
              )}
              {!exceedsStock && isLowStock && (
                <Badge bg="warning" text="dark" className="mt-2">
                  {t('cart.lowStock', {
                    available: availableStock,
                    defaultValue: 'Only {{available}} left',
                  })}
                </Badge>
              )}
              {isOutOfStock && (
                <Badge bg="secondary" className="mt-2">
                  {t('cart.outOfStock', 'Out of Stock')}
                </Badge>
              )}
            </div>
          </Col>

          {/* Price */}
          <Col xs={6} md={2} className="text-center">
            <div className="cart-item-price">
              <p className="text-muted small mb-0">{t('cart.price', 'Price')}</p>
              <p className="fw-bold mb-0">{formatCartPrice(item.price, item.currency)}</p>
            </div>
          </Col>

          {/* Quantity Controls */}
          <Col xs={6} md={2}>
            <div className="cart-item-quantity">
              <p className="text-muted small mb-2 text-center">
                {t('cart.quantity', 'Quantity')}
              </p>
              <div className="quantity-controls">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  disabled={disabled || isUpdating || item.quantity <= 1}
                  className="quantity-btn"
                >
                  <FaMinus />
                </Button>
                <Form.Control
                  type="number"
                  value={item.quantity}
                  onChange={handleInputChange}
                  disabled={disabled || isUpdating}
                  min="1"
                  max="999"
                  className="quantity-input"
                />
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  disabled={disabled || isUpdating || item.quantity >= 999}
                  className="quantity-btn"
                >
                  <FaPlus />
                </Button>
              </div>
            </div>
          </Col>

          {/* Subtotal & Remove */}
          <Col xs={12} md={2} className="text-end">
            <div className="cart-item-actions">
              {/* Subtotal */}
              <div className="cart-item-subtotal mb-2">
                <p className="text-muted small mb-0">{t('cart.subtotal', 'Subtotal')}</p>
                <p className="fw-bold mb-0 fs-5">
                  {formatCartPrice(item.totalPrice, item.currency)}
                </p>
              </div>

              {/* Remove Button */}
              <Button
                variant="outline-danger"
                size="sm"
                onClick={onRemove}
                disabled={disabled || isUpdating}
                className="w-100"
              >
                <FaTrash className={isRTL ? 'ms-2' : 'me-2'} />
                {t('cart.remove', 'Remove')}
              </Button>
            </div>
          </Col>
        </Row>

        {/* Loading Overlay */}
        {isUpdating && (
          <div className="cart-item-loading-overlay">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
