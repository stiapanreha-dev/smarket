/**
 * MerchantSidebar Component
 *
 * Navigation sidebar for merchant dashboard
 */

import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import {
  FaChartLine,
  FaBoxes,
  FaShoppingCart,
  FaCog,
  FaDollarSign,
  FaChartBar,
  FaStore
} from 'react-icons/fa';
import './MerchantSidebar.css';

interface NavItem {
  label: string;
  path: string;
  icon: JSX.Element;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/merchant/dashboard',
    icon: <FaChartLine />,
  },
  {
    label: 'Products',
    path: '/merchant/products',
    icon: <FaBoxes />,
  },
  {
    label: 'Orders',
    path: '/merchant/orders',
    icon: <FaShoppingCart />,
  },
  {
    label: 'Analytics',
    path: '/merchant/analytics',
    icon: <FaChartBar />,
  },
  {
    label: 'Payouts',
    path: '/merchant/payouts',
    icon: <FaDollarSign />,
  },
  {
    label: 'Settings',
    path: '/merchant/settings',
    icon: <FaCog />,
  },
];

export const MerchantSidebar = () => {
  const location = useLocation();

  return (
    <div className="merchant-sidebar">
      <div className="sidebar-header">
        <h5 className="mb-0">Merchant Panel</h5>
      </div>
      <Nav className="flex-column">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Nav.Link
              key={item.path}
              as={Link}
              to={item.path}
              className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Nav.Link>
          );
        })}
        <hr className="sidebar-divider" />
        <Nav.Link
          as={Link}
          to="/"
          className="sidebar-nav-link go-to-store"
        >
          <span className="sidebar-icon"><FaStore /></span>
          <span className="sidebar-label">Go to Store</span>
        </Nav.Link>
      </Nav>
    </div>
  );
};
