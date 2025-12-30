import { Nav } from 'react-bootstrap';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FaRocket,
  FaShoppingBag,
  FaStore,
  FaCode,
  FaQuestionCircle,
  FaBook
} from 'react-icons/fa';

interface DocsSidebarProps {
  onNavigate?: () => void;
}

const navItems = [
  { path: '/docs', label: 'Overview', icon: <FaBook />, exact: true },
  { path: '/docs/getting-started', label: 'Getting Started', icon: <FaRocket /> },
  { path: '/docs/buyers-guide', label: "Buyer's Guide", icon: <FaShoppingBag /> },
  { path: '/docs/sellers-guide', label: "Seller's Guide", icon: <FaStore /> },
  { path: '/docs/api', label: 'API Reference', icon: <FaCode /> },
  { path: '/docs/faq', label: 'FAQ', icon: <FaQuestionCircle /> },
];

export function DocsSidebar({ onNavigate }: DocsSidebarProps) {
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Nav className="docs-sidebar flex-column">
      <div className="docs-sidebar-header">
        <h5 className="mb-0">Documentation</h5>
      </div>
      {navItems.map((item) => (
        <Nav.Link
          as={NavLink}
          key={item.path}
          to={item.path}
          className={`docs-nav-link ${isActive(item.path, item.exact) ? 'active' : ''}`}
          onClick={onNavigate}
          end={item.exact}
        >
          <span className="docs-nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </Nav.Link>
      ))}
    </Nav>
  );
}

export default DocsSidebar;
