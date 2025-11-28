/**
 * Addresses Section Component
 *
 * Wrapper for AddressesPage component from Profile module
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { AddressesPage } from '@/pages/Profile/AddressesPage';

export const AddressesSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="section-header">
        <h2>{t('customer:addresses.title')}</h2>
      </div>
      <div className="section-content p-0">
        <AddressesPage />
      </div>
    </>
  );
};

export default AddressesSection;
