import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaShoppingCart, FaArrowRight } from 'react-icons/fa';

/**
 * Empty Cart Component
 *
 * Displays when the cart is empty with:
 * - Icon and message
 * - Call to action to continue shopping
 */
export function EmptyCart() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <Card className="empty-cart text-center py-5">
      <Card.Body>
        {/* Icon */}
        <div className="empty-cart-icon mb-4">
          <FaShoppingCart size={80} className="text-muted opacity-50" />
        </div>

        {/* Title */}
        <h2 className="mb-3">{t('cart.empty.title', 'Your cart is empty')}</h2>

        {/* Description */}
        <p className="text-muted mb-4">
          {t(
            'cart.empty.description',
            'Looks like you haven\'t added anything to your cart yet. Start shopping to find great products!',
          )}
        </p>

        {/* CTA Button */}
        <Link to="/catalog">
          <Button variant="primary" size="lg">
            {t('cart.empty.continueShopping', 'Start Shopping')}
            <FaArrowRight className={isRTL ? 'me-2' : 'ms-2'} />
          </Button>
        </Link>

        {/* Additional Info */}
        <div className="mt-5">
          <p className="text-muted small mb-2">
            {t('cart.empty.benefits.title', 'Why shop with us?')}
          </p>
          <div className="row justify-content-center">
            <div className="col-md-8">
              <ul className="list-unstyled text-muted small">
                <li className="mb-1">
                  ✓ {t('cart.empty.benefits.quality', 'High-quality products from trusted sellers')}
                </li>
                <li className="mb-1">
                  ✓ {t('cart.empty.benefits.shipping', 'Fast and reliable shipping')}
                </li>
                <li className="mb-1">
                  ✓ {t('cart.empty.benefits.support', '24/7 customer support')}
                </li>
                <li className="mb-1">
                  ✓ {t('cart.empty.benefits.returns', 'Easy returns and refunds')}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
