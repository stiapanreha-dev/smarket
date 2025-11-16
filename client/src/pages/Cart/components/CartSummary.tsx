import { Card, Form, Button, InputGroup, ListGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaTag, FaArrowRight, FaLock } from 'react-icons/fa';
import type { CartSummary as ICartSummary } from '@/types/cart';
import { formatCartPrice } from '@/types/cart';
import { LoadingSpinner } from '@/components/common';

interface CartSummaryProps {
  summary: ICartSummary | null;
  total: number;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  onApplyPromo: () => void;
  isApplyingPromo: boolean;
  onCheckout: () => void;
  disabled?: boolean;
  isMobile?: boolean;
}

/**
 * Cart Summary Component
 *
 * Displays cart totals and checkout options:
 * - Subtotal
 * - Shipping (calculated later)
 * - Tax (calculated later)
 * - Total
 * - Promo code input
 * - Checkout button
 *
 * Can be displayed as sidebar (desktop) or bottom sheet (mobile)
 */
export function CartSummary({
  summary,
  total,
  promoCode,
  onPromoCodeChange,
  onApplyPromo,
  isApplyingPromo,
  onCheckout,
  disabled = false,
  isMobile = false,
}: CartSummaryProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const currency = summary?.currency || 'USD';
  const subtotal = summary?.subtotal || 0;
  const shipping = summary?.shipping || 0;
  const tax = summary?.tax || 0;

  // Format prices
  const formattedSubtotal = formatCartPrice(subtotal, currency);
  const formattedShipping = shipping > 0 ? formatCartPrice(shipping, currency) : t('cart.calculatedAtCheckout', 'Calculated at checkout');
  const formattedTax = tax > 0 ? formatCartPrice(tax, currency) : t('cart.calculatedAtCheckout', 'Calculated at checkout');
  const formattedTotal = formatCartPrice(total, currency);

  return (
    <Card className={`cart-summary ${isMobile ? 'mobile' : 'sticky-top'}`}>
      <Card.Body>
        {/* Title */}
        {!isMobile && (
          <Card.Title className="mb-3">
            {t('cart.orderSummary', 'Order Summary')}
          </Card.Title>
        )}

        {/* Summary Details */}
        <ListGroup variant="flush" className="mb-3">
          {/* Subtotal */}
          <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
            <span className="text-muted">{t('cart.subtotal', 'Subtotal')}</span>
            <span className="fw-semibold">{formattedSubtotal}</span>
          </ListGroup.Item>

          {/* Shipping */}
          <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
            <span className="text-muted">{t('cart.shipping', 'Shipping')}</span>
            <span className={shipping > 0 ? 'fw-semibold' : 'text-muted small'}>
              {formattedShipping}
            </span>
          </ListGroup.Item>

          {/* Tax */}
          <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
            <span className="text-muted">{t('cart.tax', 'Tax')}</span>
            <span className={tax > 0 ? 'fw-semibold' : 'text-muted small'}>
              {formattedTax}
            </span>
          </ListGroup.Item>

          {/* Total */}
          <ListGroup.Item className="d-flex justify-content-between align-items-center px-0 border-top pt-3">
            <span className="fw-bold fs-5">{t('cart.total', 'Total')}</span>
            <span className="fw-bold fs-5 text-primary">{formattedTotal}</span>
          </ListGroup.Item>
        </ListGroup>

        {/* Promo Code */}
        <div className="promo-code-section mb-3">
          <Form.Group>
            <Form.Label className="small fw-semibold">
              <FaTag className={isRTL ? 'ms-2' : 'me-2'} />
              {t('cart.promoCode', 'Promo Code')}
            </Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder={t('cart.enterPromoCode', 'Enter code')}
                value={promoCode}
                onChange={(e) => onPromoCodeChange(e.target.value)}
                disabled={disabled || isApplyingPromo}
              />
              <Button
                variant="outline-primary"
                onClick={onApplyPromo}
                disabled={disabled || isApplyingPromo || !promoCode.trim()}
              >
                {isApplyingPromo ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  t('cart.apply', 'Apply')
                )}
              </Button>
            </InputGroup>
          </Form.Group>
        </div>

        {/* Checkout Button */}
        <Button
          variant="primary"
          size="lg"
          className="w-100 mb-2"
          onClick={onCheckout}
          disabled={disabled || total === 0}
        >
          {t('cart.proceedToCheckout', 'Proceed to Checkout')}
          <FaArrowRight className={isRTL ? 'me-2' : 'ms-2'} />
        </Button>

        {/* Security Note */}
        <p className="text-center text-muted small mb-0">
          <FaLock className={isRTL ? 'ms-1' : 'me-1'} />
          {t('cart.secureCheckout', 'Secure Checkout')}
        </p>

        {/* Merchant Info */}
        {summary && summary.merchantCount > 1 && (
          <div className="alert alert-info mt-3 mb-0 small">
            {t('cart.multipleMerchants', {
              count: summary.merchantCount,
              defaultValue: 'This order contains items from {{count}} different sellers',
            })}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
