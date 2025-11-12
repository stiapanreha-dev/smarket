import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaHeart, FaArrowRight, FaStar } from 'react-icons/fa';

/**
 * Empty Wishlist Component
 *
 * Displays when the wishlist is empty with:
 * - Icon and message
 * - Call to action to start adding favorites
 */
export function EmptyWishlist() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <Card className="empty-wishlist text-center py-5">
      <Card.Body>
        {/* Icon */}
        <div className="empty-wishlist-icon mb-4">
          <FaHeart size={80} className="text-muted opacity-50" />
        </div>

        {/* Title */}
        <h2 className="mb-3">{t('wishlist.empty.title', 'Your wishlist is empty')}</h2>

        {/* Description */}
        <p className="text-muted mb-4">
          {t(
            'wishlist.empty.description',
            'Start adding your favorite products to your wishlist. You can save items for later or share your wishlist with friends!',
          )}
        </p>

        {/* CTA Button */}
        <Link to="/catalog">
          <Button variant="primary" size="lg">
            <FaStar className={isRTL ? 'ms-2' : 'me-2'} />
            {t('wishlist.empty.startAdding', 'Start Adding Favorites')}
            <FaArrowRight className={isRTL ? 'me-2' : 'ms-2'} />
          </Button>
        </Link>

        {/* Additional Info */}
        <div className="mt-5">
          <p className="text-muted small mb-2">
            {t('wishlist.empty.benefits.title', 'Why use a wishlist?')}
          </p>
          <div className="row justify-content-center">
            <div className="col-md-8">
              <ul className="list-unstyled text-muted small">
                <li className="mb-1">
                  ✓{' '}
                  {t(
                    'wishlist.empty.benefits.save',
                    'Save your favorite items for later purchase',
                  )}
                </li>
                <li className="mb-1">
                  ✓{' '}
                  {t(
                    'wishlist.empty.benefits.track',
                    'Track price changes and availability',
                  )}
                </li>
                <li className="mb-1">
                  ✓{' '}
                  {t(
                    'wishlist.empty.benefits.share',
                    'Share your wishlist with friends and family',
                  )}
                </li>
                <li className="mb-1">
                  ✓{' '}
                  {t(
                    'wishlist.empty.benefits.organize',
                    'Keep your shopping organized and efficient',
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

export default EmptyWishlist;
