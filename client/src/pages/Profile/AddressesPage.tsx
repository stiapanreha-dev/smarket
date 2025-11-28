/**
 * Addresses Management Page
 *
 * Allows users to manage their saved addresses:
 * - View all saved addresses
 * - Add new addresses
 * - Edit existing addresses
 * - Delete addresses
 * - Set default address
 */

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaEdit, FaTrash, FaStar, FaRegStar, FaMapMarkerAlt } from 'react-icons/fa';
import { AddressModal } from './components/AddressModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import type { UserAddress } from '@/types/address';
import { apiClient } from '@/api/axios.config';
import './AddressesPage.css';

export function AddressesPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // State
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load addresses
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<UserAddress[]>('/users/me/addresses');
      setAddresses(response.data);
    } catch (err: any) {
      console.error('Failed to load addresses:', err);
      setError(err.response?.data?.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  // Handle add new address
  const handleAddAddress = () => {
    setSelectedAddress(null);
    setModalMode('add');
    setShowAddressModal(true);
  };

  // Handle edit address
  const handleEditAddress = (address: UserAddress) => {
    setSelectedAddress(address);
    setModalMode('edit');
    setShowAddressModal(true);
  };

  // Handle delete address
  const handleDeleteClick = (address: UserAddress) => {
    setSelectedAddress(address);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAddress) return;

    try {
      setActionLoading(`delete-${selectedAddress.id}`);
      await apiClient.delete(`/users/me/addresses/${selectedAddress.id}`);
      await loadAddresses();
      setShowDeleteModal(false);
      setSelectedAddress(null);
    } catch (err: any) {
      console.error('Failed to delete address:', err);
      setError(err.response?.data?.message || 'Failed to delete address');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle set default
  const handleSetDefault = async (address: UserAddress) => {
    if (address.is_default) return;

    try {
      setActionLoading(`default-${address.id}`);
      await apiClient.post(`/users/me/addresses/${address.id}/set-default`);
      await loadAddresses();
    } catch (err: any) {
      console.error('Failed to set default address:', err);
      setError(err.response?.data?.message || 'Failed to set default address');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle modal save
  const handleModalSave = async () => {
    await loadAddresses();
    setShowAddressModal(false);
    setSelectedAddress(null);
  };

  // Render empty state
  const renderEmptyState = () => (
    <Card className="text-center py-5">
      <Card.Body>
        <FaMapMarkerAlt size={48} className="text-muted mb-3" />
        <h5 className="mb-3">{t('profile.addresses.noAddresses', 'No addresses saved')}</h5>
        <p className="text-muted mb-4">
          {t(
            'profile.addresses.noAddressesDescription',
            'Add your first address to make checkout faster and easier.',
          )}
        </p>
        <Button variant="primary" onClick={handleAddAddress}>
          <FaPlus className="me-2" />
          {t('profile.addresses.addFirstAddress', 'Add Your First Address')}
        </Button>
      </Card.Body>
    </Card>
  );

  // Render address card
  const renderAddressCard = (address: UserAddress) => {
    const isSettingDefault = actionLoading === `default-${address.id}`;
    const isDeleting = actionLoading === `delete-${address.id}`;

    return (
      <Col key={address.id} xs={12} md={6} xl={4}>
        <Card className={`address-card h-100 ${address.is_default ? 'default-address' : ''}`}>
          <Card.Body>
            {/* Header with default badge */}
            <div className="address-header d-flex justify-content-between align-items-start mb-3">
              <div className="flex-grow-1">
                <h6 className="mb-1">{address.full_name}</h6>
                <small className="text-muted">{address.phone}</small>
              </div>
              {address.is_default && (
                <Badge bg="primary" className="default-badge">
                  <FaStar className="me-1" size={12} />
                  {t('profile.addresses.default', 'Default')}
                </Badge>
              )}
            </div>

            {/* Address details */}
            <div className="address-details text-muted">
              <div>{address.address_line1}</div>
              {address.address_line2 && <div>{address.address_line2}</div>}
              <div>
                {address.city}
                {address.state && `, ${address.state}`} {address.postal_code}
              </div>
              <div>{address.country}</div>
            </div>

            {/* Actions */}
            <div className="address-actions mt-3 pt-3 border-top">
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleEditAddress(address)}
                  disabled={!!actionLoading}
                >
                  <FaEdit className="me-1" />
                  {t('common.edit', 'Edit')}
                </Button>

                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDeleteClick(address)}
                  disabled={isDeleting || !!actionLoading}
                >
                  {isDeleting ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <FaTrash className="me-1" />
                      {t('common.delete', 'Delete')}
                    </>
                  )}
                </Button>

                {!address.is_default && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => handleSetDefault(address)}
                    disabled={isSettingDefault || !!actionLoading}
                  >
                    {isSettingDefault ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <>
                        <FaRegStar className="me-1" />
                        {t('profile.addresses.setDefault', 'Set as Default')}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  return (
    <Container className="addresses-page py-4">
      {/* Header */}
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-1">{t('profile.addresses.title', 'My Addresses')}</h2>
            <p className="text-muted mb-0">
              {t('profile.addresses.subtitle', 'Manage your saved delivery addresses')}
            </p>
          </div>
          {addresses.length > 0 && (
            <Button variant="primary" onClick={handleAddAddress} disabled={!!actionLoading}>
              <FaPlus className={isRTL ? 'ms-2' : 'me-2'} />
              {t('profile.addresses.addNew', 'Add New Address')}
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-3">{t('common.loading', 'Loading...')}</p>
        </div>
      )}

      {/* Address List */}
      {!loading && (
        <>
          {addresses.length === 0 ? (
            renderEmptyState()
          ) : (
            <Row className="g-3">{addresses.map(renderAddressCard)}</Row>
          )}
        </>
      )}

      {/* Address Modal */}
      <AddressModal
        show={showAddressModal}
        mode={modalMode}
        address={selectedAddress}
        onClose={() => {
          setShowAddressModal(false);
          setSelectedAddress(null);
        }}
        onSave={handleModalSave}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        address={selectedAddress}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAddress(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={!!actionLoading}
      />
    </Container>
  );
}
