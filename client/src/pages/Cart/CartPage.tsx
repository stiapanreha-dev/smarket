import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaShoppingCart } from 'react-icons/fa';
import {
  useCartStore,
  useCartItems,
  useCartSummary,
  useCartActions,
  useCartLoading,
  useCartError,
} from '@/store/cartStore';
import { isCartEmpty } from '@/types/cart';
import { Navbar, Footer } from '@/components/layout';
import { CartItem } from './components/CartItem';
import { CartSummary } from './components/CartSummary';
import { EmptyCart } from './components/EmptyCart';
import { RemoveItemModal } from './components/RemoveItemModal';
import { CartPageSkeleton } from './components/CartPageSkeleton';
import './CartPage.css';

/**
 * Shopping Cart Page Component
 *
 * Features:
 * - Cart items list with quantity controls
 * - Real-time total calculation
 * - Summary sidebar with totals
 * - Promo code input
 * - Empty state
 * - Confirmation modal for item removal
 * - Loading states
 * - Responsive design (mobile bottom sheet)
 * - Multi-language support with RTL
 */
export function CartPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  // Cart state
  const { cart } = useCartStore();
  const items = useCartItems();
  const { summary, total, itemsCount } = useCartSummary();
  const { loadCart, updateQuantity, removeItem } = useCartActions();
  const isLoading = useCartLoading();
  const { error, clearError } = useCartError();

  // Local state
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Load cart on mount
  useEffect(() => {
    loadCart().catch(console.error);
  }, [loadCart]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Handle quantity change
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      setItemToRemove(itemId);
      return;
    }

    try {
      await updateQuantity(itemId, newQuantity);
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  // Handle item removal
  const handleRemoveItem = async () => {
    if (!itemToRemove) return;

    setIsRemoving(true);
    try {
      await removeItem(itemToRemove);
      setItemToRemove(null);
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  // Handle promo code application
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    setIsApplyingPromo(true);
    try {
      // TODO: Implement promo code API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Apply promo code:', promoCode);
    } catch (err) {
      console.error('Failed to apply promo code:', err);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    navigate('/checkout');
  };

  // Loading skeleton
  if (isLoading && !cart) {
    return (
      <>
        <Navbar />
        <div className={`cart-page ${isRTL ? 'rtl' : ''}`}>
          <Container className="py-4">
            <CartPageSkeleton />
          </Container>
        </div>
        <Footer />
      </>
    );
  }

  // Empty cart state
  if (!cart || isCartEmpty(cart)) {
    return (
      <>
        <Navbar />
        <div className={`cart-page ${isRTL ? 'rtl' : ''}`}>
          <Container className="py-4">
            <EmptyCart />
          </Container>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={`cart-page ${isRTL ? 'rtl' : ''}`}>
        <Container className="py-4">
          {/* Header */}
          <div className="cart-header mb-4">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div>
                <h1 className="mb-2">
                  <FaShoppingCart className="me-2" />
                  {t('cart.title', 'Shopping Cart')}
                </h1>
                <p className="text-muted mb-0">
                  {t('cart.itemsCount', {
                    count: itemsCount,
                    defaultValue: '{{count}} items',
                  })}
                </p>
              </div>
              <Link to="/catalog" className="btn btn-outline-primary">
                <FaArrowLeft className={isRTL ? 'ms-2' : 'me-2'} />
                {t('cart.continueShopping', 'Continue Shopping')}
              </Link>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="danger" dismissible onClose={clearError} className="mb-4">
              {error}
            </Alert>
          )}

          {/* Main Content */}
          <Row className="g-4">
            {/* Cart Items */}
            <Col lg={8}>
              <div className="cart-items">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={() => setItemToRemove(item.id)}
                    disabled={isLoading}
                  />
                ))}
              </div>
            </Col>

            {/* Summary Sidebar */}
            <Col lg={4}>
              <div className="cart-summary-wrapper">
                <CartSummary
                  summary={summary}
                  total={total}
                  promoCode={promoCode}
                  onPromoCodeChange={setPromoCode}
                  onApplyPromo={handleApplyPromo}
                  isApplyingPromo={isApplyingPromo}
                  onCheckout={handleCheckout}
                  disabled={isLoading}
                />
              </div>
            </Col>
          </Row>

          {/* Mobile Summary (bottom sheet on small screens) */}
          <div className="mobile-summary d-lg-none">
            <CartSummary
              summary={summary}
              total={total}
              promoCode={promoCode}
              onPromoCodeChange={setPromoCode}
              onApplyPromo={handleApplyPromo}
              isApplyingPromo={isApplyingPromo}
              onCheckout={handleCheckout}
              disabled={isLoading}
              isMobile
            />
          </div>
        </Container>
      </div>
      <Footer />

      {/* Remove Item Confirmation Modal */}
      <RemoveItemModal
        show={!!itemToRemove}
        onHide={() => setItemToRemove(null)}
        onConfirm={handleRemoveItem}
        isLoading={isRemoving}
      />
    </>
  );
}

export default CartPage;
