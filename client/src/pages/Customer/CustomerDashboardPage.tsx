/**
 * Customer Dashboard Page
 *
 * Main customer panel with sidebar navigation
 * and different sections (Dashboard, Orders, Payments, Profile, etc.)
 */

import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Navbar, Footer } from '@/components/layout';
import { CustomerSidebar } from './components/CustomerSidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { OrdersSection } from './components/OrdersSection';
import { PaymentsSection } from './components/PaymentsSection';
import { ProfileSection } from './components/ProfileSection';
import { AddressesSection } from './components/AddressesSection';
import { NotificationsSection } from './components/NotificationsSection';
import { WishlistSection } from './components/WishlistSection';
import './CustomerDashboardPage.css';

export type CustomerSection =
  | 'overview'
  | 'orders'
  | 'payments'
  | 'profile'
  | 'addresses'
  | 'notifications'
  | 'wishlist';

export const CustomerDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<CustomerSection>('overview');

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <DashboardOverview onNavigate={setActiveSection} />;
      case 'orders':
        return <OrdersSection />;
      case 'payments':
        return <PaymentsSection />;
      case 'profile':
        return <ProfileSection />;
      case 'addresses':
        return <AddressesSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'wishlist':
        return <WishlistSection />;
      default:
        return <DashboardOverview onNavigate={setActiveSection} />;
    }
  };

  return (
    <>
      <Navbar />
      <Container className="customer-dashboard-page py-5">
        <h1 className="mb-4 page-title">{t('customer:dashboard.title')}</h1>
        <Row>
          <Col lg={3} md={4} className="mb-4">
            <CustomerSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
          </Col>
          <Col lg={9} md={8}>
            <div className="customer-dashboard-content bg-white rounded shadow-sm">
              {renderSection()}
            </div>
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
};

export default CustomerDashboardPage;
