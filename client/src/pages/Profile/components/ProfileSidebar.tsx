/**
 * Profile Sidebar Component
 *
 * Navigation sidebar for profile sections
 */

import React from 'react';
import { Card } from 'react-bootstrap';
import {
  FaUser,
  FaMapMarkerAlt,
  FaCreditCard,
  FaCog,
  FaLock,
} from 'react-icons/fa';
import type { ProfileSection } from '../ProfilePage';

interface ProfileSidebarProps {
  activeSection: ProfileSection;
  onSectionChange: (section: ProfileSection) => void;
}

interface NavItem {
  id: ProfileSection;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: 'personal',
    label: 'Personal Information',
    icon: <FaUser />,
  },
  {
    id: 'addresses',
    label: 'Addresses',
    icon: <FaMapMarkerAlt />,
  },
  {
    id: 'payment-methods',
    label: 'Payment Methods',
    icon: <FaCreditCard />,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <FaCog />,
  },
  {
    id: 'security',
    label: 'Security',
    icon: <FaLock />,
  },
];

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  return (
    <Card className="shadow-sm">
      <Card.Body className="p-3">
        <ul className="profile-sidebar-nav">
          {navItems.map((item) => (
            <li key={item.id} className="profile-sidebar-nav-item">
              <a
                href="#"
                className={`profile-sidebar-nav-link ${
                  activeSection === item.id ? 'active' : ''
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  onSectionChange(item.id);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </Card.Body>
    </Card>
  );
};

export default ProfileSidebar;
