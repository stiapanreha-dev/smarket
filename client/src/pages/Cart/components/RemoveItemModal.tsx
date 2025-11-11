import { useTranslation } from 'react-i18next';
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { Modal } from '@/components/common';

interface RemoveItemModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

/**
 * Remove Item Confirmation Modal
 *
 * Confirms the user wants to remove an item from their cart
 */
export function RemoveItemModal({ show, onHide, onConfirm, isLoading = false }: RemoveItemModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      show={show}
      onHide={onHide}
      title={
        <>
          <FaExclamationTriangle className="text-warning me-2" />
          {t('cart.removeModal.title', 'Remove Item')}
        </>
      }
      confirmText={t('cart.removeModal.confirm', 'Remove')}
      cancelText={t('cart.removeModal.cancel', 'Cancel')}
      confirmVariant="danger"
      onConfirm={onConfirm}
      onCancel={onHide}
      loading={isLoading}
      centered
    >
      <div className="text-center py-3">
        <FaTrash size={48} className="text-danger mb-3 opacity-75" />
        <p className="mb-0">
          {t(
            'cart.removeModal.message',
            'Are you sure you want to remove this item from your cart?',
          )}
        </p>
        <p className="text-muted small mt-2 mb-0">
          {t('cart.removeModal.subtitle', 'This action cannot be undone.')}
        </p>
      </div>
    </Modal>
  );
}
