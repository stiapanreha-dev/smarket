/**
 * Profile Page
 *
 * User profile management page with sidebar navigation
 * and different sections (Personal Info, Addresses, Payment Methods, etc.)
 */

import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Navbar, Footer } from '@/components/layout';
import { ProfileSidebar } from './components/ProfileSidebar';
import { PersonalInformation } from './components/PersonalInformation';
import './ProfilePage.css';

export type ProfileSection =
  | 'personal'
  | 'addresses'
  | 'payment-methods'
  | 'settings'
  | 'security';

export const ProfilePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ProfileSection>('personal');

  const renderSection = () => {
    switch (activeSection) {
      case 'personal':
        return <PersonalInformation />;
      case 'addresses':
        return <div className="p-4">Addresses section - Coming soon</div>;
      case 'payment-methods':
        return <div className="p-4">Payment Methods section - Coming soon</div>;
      case 'settings':
        return <div className="p-4">Settings section - Coming soon</div>;
      case 'security':
        return <div className="p-4">Security section - Coming soon</div>;
      default:
        return <PersonalInformation />;
    }
  };

  return (
    <>
      <Navbar />
      <Container className="profile-page py-5">
        <h1 className="mb-4">My Profile</h1>
        <Row>
          <Col lg={3} md={4} className="mb-4">
            <ProfileSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
          </Col>
          <Col lg={9} md={8}>
            <div className="profile-content bg-white rounded shadow-sm">
              {renderSection()}
            </div>
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
};

export default ProfilePage;
