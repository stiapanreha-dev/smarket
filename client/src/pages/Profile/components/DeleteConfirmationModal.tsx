/**
 * Delete Confirmation Modal Component
 *
 * Modal for confirming address deletion
 */

import { Modal, Button, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle } from 'react-icons/fa';
import type { UserAddress } from '@/types/address';

interface DeleteConfirmationModalProps {
  show: boolean;
  address: UserAddress | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function DeleteConfirmationModal({
  show,
  address,
  onClose,
  onConfirm,
  loading,
}: DeleteConfirmationModalProps) {
  const { t } = useTranslation();

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static" keyboard={!loading}>
      <Modal.Header closeButton={!loading}>
        <Modal.Title>
          {t('profile.addresses.deleteAddress', 'Delete Address')}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="text-center mb-3">
          <FaExclamationTriangle size={48} className="text-warning mb-3" />
          <h6>{t('profile.addresses.deleteConfirmation', 'Are you sure you want to delete this address?')}</h6>
        </div>

        {address && (
          <div className="bg-light p-3 rounded">
            <div className="mb-1">
              <strong>{address.full_name}</strong>
            </div>
            <div className="text-muted small">
              <div>{address.address_line1}</div>
              {address.address_line2 && <div>{address.address_line2}</div>}
              <div>
                {address.city}
                {address.state && `, ${address.state}`} {address.postal_code}
              </div>
              <div>{address.country}</div>
            </div>
          </div>
        )}

        <p className="text-muted small mt-3 mb-0">
          {t('profile.addresses.deleteWarning', 'This action cannot be undone.')}
        </p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              {t('common.deleting', 'Deleting...')}
            </>
          ) : (
            t('common.delete', 'Delete')
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
