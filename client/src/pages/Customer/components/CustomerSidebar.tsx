/**
 * Customer Sidebar Component
 *
 * Navigation sidebar for customer dashboard sections
 */

import React from 'react';
import { Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import {
  FaChartLine,
  FaShoppingBag,
  FaCreditCard,
  FaUser,
  FaMapMarkerAlt,
  FaBell,
  FaHeart,
} from 'react-icons/fa';
import type { CustomerSection } from '../CustomerDashboardPage';

interface CustomerSidebarProps {
  activeSection: CustomerSection;
  onSectionChange: (section: CustomerSection) => void;
}

interface NavItem {
  id: CustomerSection;
  labelKey: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: 'overview',
    labelKey: 'customer:sections.overview',
    icon: <FaChartLine />,
  },
  {
    id: 'orders',
    labelKey: 'customer:sections.orders',
    icon: <FaShoppingBag />,
  },
  {
    id: 'payments',
    labelKey: 'customer:sections.payments',
    icon: <FaCreditCard />,
  },
  {
    id: 'profile',
    labelKey: 'customer:sections.profile',
    icon: <FaUser />,
  },
  {
    id: 'addresses',
    labelKey: 'customer:sections.addresses',
    icon: <FaMapMarkerAlt />,
  },
  {
    id: 'notifications',
    labelKey: 'customer:sections.notifications',
    icon: <FaBell />,
  },
  {
    id: 'wishlist',
    labelKey: 'customer:sections.wishlist',
    icon: <FaHeart />,
  },
];

export const CustomerSidebar: React.FC<CustomerSidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { t } = useTranslation();

  return (
    <Card className="shadow-sm">
      <Card.Body className="p-3">
        <ul className="customer-sidebar-nav">
          {navItems.map((item) => (
            <li key={item.id} className="customer-sidebar-nav-item">
              <a
                href="#"
                className={`customer-sidebar-nav-link ${
                  activeSection === item.id ? 'active' : ''
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  onSectionChange(item.id);
                }}
              >
                {item.icon}
                <span>{t(item.labelKey)}</span>
              </a>
            </li>
          ))}
        </ul>
      </Card.Body>
    </Card>
  );
};

export default CustomerSidebar;
