/**
 * Profile Section Component
 *
 * Wrapper for PersonalInformation component from Profile module
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { PersonalInformation } from '@/pages/Profile/components/PersonalInformation';

export const ProfileSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="section-header">
        <h2>{t('customer:profile.title')}</h2>
      </div>
      <div className="section-content">
        <PersonalInformation />
      </div>
    </>
  );
};

export default ProfileSection;
