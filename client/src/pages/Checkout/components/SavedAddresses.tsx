/**
 * Saved Addresses Component
 *
 * Displays saved addresses for the user to select from
 * or allows adding a new address
 */

import { useState } from 'react';
import { Card, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaCheckCircle } from 'react-icons/fa';
import type { Address } from '@/types';
import './SavedAddresses.css';

interface SavedAddressesProps {
  addresses: Address[];
  selectedAddressId?: string;
  onSelectAddress: (address: Address, addressId: string) => void;
  onAddNewAddress: () => void;
}

export function SavedAddresses({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddNewAddress,
}: SavedAddressesProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedAddressId);

  // Handle address selection
  const handleAddressSelect = (address: Address, index: number) => {
    const addressId = `address-${index}`;
    setSelectedId(addressId);
    onSelectAddress(address, addressId);
  };

  return (
    <div className="saved-addresses">
      <div className="saved-addresses-header">
        <h5 className="mb-3">
          {t('checkout.shippingAddress.savedAddresses', 'Your Saved Addresses')}
        </h5>
        <p className="text-muted">
          {t('checkout.shippingAddress.selectOrAdd', 'Select an address or add a new one')}
        </p>
      </div>

      <div className="addresses-grid">
        {addresses.map((address, index) => {
          const addressId = `address-${index}`;
          const isSelected = selectedId === addressId;

          return (
            <Card
              key={addressId}
              className={`address-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleAddressSelect(address, index)}
            >
              <Card.Body>
                {/* Selection Radio */}
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <Form.Check
                    type="radio"
                    name="saved-address"
                    id={addressId}
                    checked={isSelected}
                    onChange={() => handleAddressSelect(address, index)}
                    label=""
                    className="address-radio"
                  />
                  {isSelected && (
                    <FaCheckCircle className="text-primary" size={20} />
                  )}
                </div>

                {/* Address Details */}
                <div className="address-details">
                  {/* Name */}
                  {(address.first_name || address.last_name) && (
                    <div className="address-name">
                      <strong>
                        {[address.first_name, address.last_name]
                          .filter(Boolean)
                          .join(' ')}
                      </strong>
                    </div>
                  )}

                  {/* Company */}
                  {address.company && (
                    <div className="address-company text-muted">
                      {address.company}
                    </div>
                  )}

                  {/* Street Address */}
                  <div className="address-street">
                    {address.street}
                    {address.street2 && (
                      <>
                        <br />
                        {address.street2}
                      </>
                    )}
                  </div>

                  {/* City, State, Postal Code */}
                  <div className="address-location">
                    {address.city}
                    {address.state && `, ${address.state}`} {address.postal_code}
                  </div>

                  {/* Country */}
                  <div className="address-country text-muted">
                    {address.country}
                  </div>

                  {/* Phone */}
                  {address.phone && (
                    <div className="address-phone text-muted mt-2">
                      <small>{address.phone}</small>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          );
        })}

        {/* Add New Address Card */}
        <Card className="address-card add-new-card" onClick={onAddNewAddress}>
          <Card.Body className="d-flex flex-column align-items-center justify-content-center">
            <FaPlus size={32} className="text-primary mb-2" />
            <div className="text-center">
              <strong>{t('checkout.shippingAddress.addNewAddress', 'Add New Address')}</strong>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
