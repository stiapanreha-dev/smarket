import { Link } from 'react-router-dom';
import {
  FaRocket,
  FaShoppingBag,
  FaStore,
  FaCode,
  FaQuestionCircle,
} from 'react-icons/fa';
import { DocsLayout } from './components/DocsLayout';

const sections = [
  {
    path: '/docs/getting-started',
    icon: <FaRocket size={24} />,
    title: 'Getting Started',
    description: 'Learn how to create an account, set up your profile, and make your first purchase.',
  },
  {
    path: '/docs/buyers-guide',
    icon: <FaShoppingBag size={24} />,
    title: "Buyer's Guide",
    description: 'Everything you need to know about browsing, purchasing, and tracking orders.',
  },
  {
    path: '/docs/sellers-guide',
    icon: <FaStore size={24} />,
    title: "Seller's Guide",
    description: 'Complete guide for merchants: listing products, managing orders, and payouts.',
  },
  {
    path: '/docs/api',
    icon: <FaCode size={24} />,
    title: 'API Reference',
    description: 'Technical documentation for developers integrating with our platform.',
  },
  {
    path: '/docs/faq',
    icon: <FaQuestionCircle size={24} />,
    title: 'FAQ',
    description: 'Frequently asked questions about orders, payments, shipping, and more.',
  },
];

export function DocsPage() {
  return (
    <DocsLayout title="Documentation" description="SnailMarketplace documentation and guides">
      <h1>Documentation</h1>
      <p className="lead">
        Welcome to SnailMarketplace documentation. Find guides, tutorials, and references
        to help you get the most out of our platform.
      </p>

      <div className="docs-overview-grid">
        {sections.map((section) => (
          <Link
            key={section.path}
            to={section.path}
            className="docs-overview-card"
          >
            <h3>
              <span style={{ color: 'var(--main-color)' }}>{section.icon}</span>
              {section.title}
            </h3>
            <p>{section.description}</p>
          </Link>
        ))}
      </div>

      <h2>Quick Links</h2>
      <ul>
        <li><Link to="/docs/getting-started">Create your account</Link></li>
        <li><Link to="/docs/buyers-guide">How to make a purchase</Link></li>
        <li><Link to="/docs/sellers-guide">Start selling on SnailMarketplace</Link></li>
        <li><a href="/api/v1/docs" target="_blank" rel="noopener noreferrer">API Swagger Documentation</a></li>
      </ul>
    </DocsLayout>
  );
}

export default DocsPage;
