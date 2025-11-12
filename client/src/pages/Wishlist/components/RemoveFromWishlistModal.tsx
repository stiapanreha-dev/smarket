import { useTranslation } from 'react-i18next';
import { FaHeart, FaExclamationTriangle } from 'react-icons/fa';
import { Modal } from '@/components/common';

interface RemoveFromWishlistModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

/**
 * Remove From Wishlist Confirmation Modal
 *
 * Confirms the user wants to remove an item from their wishlist
 */
export function RemoveFromWishlistModal({
  show,
  onHide,
  onConfirm,
  isLoading = false,
}: RemoveFromWishlistModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      show={show}
      onHide={onHide}
      title={
        <>
          <FaExclamationTriangle className="text-warning me-2" />
          {t('wishlist.removeModal.title', 'Remove from Wishlist')}
        </>
      }
      confirmText={t('wishlist.removeModal.confirm', 'Remove')}
      cancelText={t('wishlist.removeModal.cancel', 'Cancel')}
      confirmVariant="danger"
      onConfirm={onConfirm}
      onCancel={onHide}
      loading={isLoading}
      centered
    >
      <div className="text-center py-3">
        <FaHeart size={48} className="text-danger mb-3 opacity-75" />
        <p className="mb-0">
          {t(
            'wishlist.removeModal.message',
            'Are you sure you want to remove this item from your wishlist?',
          )}
        </p>
        <p className="text-muted small mt-2 mb-0">
          {t(
            'wishlist.removeModal.subtitle',
            'You can always add it back later.',
          )}
        </p>
      </div>
    </Modal>
  );
}

export default RemoveFromWishlistModal;
