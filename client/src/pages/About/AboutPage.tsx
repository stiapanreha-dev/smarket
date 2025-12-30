import { Container, Row, Col, Card } from 'react-bootstrap';
import {
  FaShoppingCart,
  FaUsers,
  FaStore,
  FaCreditCard,
  FaGlobe,
  FaShieldAlt,
  FaRocket,
  FaCode,
  FaDatabase,
  FaServer,
  FaReact,
  FaDocker,
} from 'react-icons/fa';
import {
  SiTypescript,
  SiNestjs,
  SiPostgresql,
  SiRedis,
  SiStripe,
  SiVite,
  SiTailwindcss,
} from 'react-icons/si';
import { Navbar, Footer } from '@/components/layout';
import { SEO } from '@/components/SEO';
import './AboutPage.css';

/**
 * About Page
 * Describes marketplace features and technology stack
 */
export function AboutPage() {
  const features = [
    {
      icon: <FaShoppingCart size={32} />,
      title: 'Multi-Product Types',
      description:
        'Support for physical goods, digital products, and services with specialized workflows for each type.',
    },
    {
      icon: <FaUsers size={32} />,
      title: 'User Management',
      description:
        'Complete user authentication with JWT, role-based access control, and profile management.',
    },
    {
      icon: <FaStore size={32} />,
      title: 'Merchant Dashboard',
      description:
        'Full-featured merchant portal for product management, order fulfillment, and analytics.',
    },
    {
      icon: <FaCreditCard size={32} />,
      title: 'Payment Integration',
      description:
        'Secure payment processing with Stripe integration, supporting multiple currencies.',
    },
    {
      icon: <FaGlobe size={32} />,
      title: 'Multi-Language Support',
      description:
        'Internationalization with English, Russian, and Arabic (RTL) language support.',
    },
    {
      icon: <FaShieldAlt size={32} />,
      title: 'Security First',
      description:
        'Argon2 password hashing, JWT authentication, rate limiting, and input validation.',
    },
    {
      icon: <FaRocket size={32} />,
      title: 'Performance Optimized',
      description:
        'Redis caching, lazy loading, code splitting, and optimized database queries.',
    },
    {
      icon: <FaCode size={32} />,
      title: 'Modern Architecture',
      description:
        'Modular monolith with event-driven patterns, FSM for order management, and clean code.',
    },
  ];

  const backendStack = [
    { icon: <SiNestjs size={40} color="#E0234E" />, name: 'NestJS', description: 'Node.js framework' },
    { icon: <SiTypescript size={40} color="#3178C6" />, name: 'TypeScript', description: 'Type safety' },
    { icon: <SiPostgresql size={40} color="#4169E1" />, name: 'PostgreSQL', description: 'Primary database' },
    { icon: <SiRedis size={40} color="#DC382D" />, name: 'Redis', description: 'Caching & sessions' },
    { icon: <SiStripe size={40} color="#635BFF" />, name: 'Stripe', description: 'Payment processing' },
    { icon: <FaDatabase size={40} color="#336791" />, name: 'TypeORM', description: 'Database ORM' },
  ];

  const frontendStack = [
    { icon: <FaReact size={40} color="#61DAFB" />, name: 'React 18', description: 'UI library' },
    { icon: <SiTypescript size={40} color="#3178C6" />, name: 'TypeScript', description: 'Type safety' },
    { icon: <SiVite size={40} color="#646CFF" />, name: 'Vite', description: 'Build tool' },
    { icon: <SiTailwindcss size={40} color="#7952B3" />, name: 'Bootstrap 5', description: 'UI framework' },
    { icon: <FaCode size={40} color="#764ABC" />, name: 'Zustand', description: 'State management' },
    { icon: <FaRocket size={40} color="#FF4154" />, name: 'React Query', description: 'Data fetching' },
  ];

  const infrastructure = [
    { icon: <FaDocker size={40} color="#2496ED" />, name: 'Docker', description: 'Containerization' },
    { icon: <FaServer size={40} color="#F38020" />, name: 'Nginx', description: 'Reverse proxy' },
    { icon: <FaGlobe size={40} color="#F48120" />, name: 'Cloudflare', description: 'CDN & tunnels' },
    { icon: <FaDatabase size={40} color="#C12127" />, name: 'MinIO', description: 'S3-compatible storage' },
  ];

  return (
    <>
      <SEO
        title="About - SnailMarketplace"
        description="Learn about SnailMarketplace features and technology stack"
      />
      <Navbar />

      <div className="about-page">
        {/* Hero Section */}
        <section className="about-hero">
          <Container>
            <Row className="justify-content-center text-center">
              <Col lg={8}>
                <h1 className="display-4 fw-bold mb-4">SnailMarketplace</h1>
                <p className="lead text-muted mb-4">
                  A modern, full-featured marketplace platform built with cutting-edge technologies.
                  Designed for scalability, security, and exceptional user experience.
                </p>
                <div className="hero-badges">
                  <span className="badge bg-primary me-2">Open Source</span>
                  <span className="badge bg-success me-2">Production Ready</span>
                  <span className="badge bg-info">Multi-tenant</span>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Features Section */}
        <section className="about-section">
          <Container>
            <h2 className="section-title text-center mb-5">Platform Features</h2>
            <Row>
              {features.map((feature, index) => (
                <Col md={6} lg={3} key={index} className="mb-4">
                  <Card className="feature-card h-100 text-center">
                    <Card.Body>
                      <div className="feature-icon mb-3">{feature.icon}</div>
                      <Card.Title className="h5">{feature.title}</Card.Title>
                      <Card.Text className="text-muted small">
                        {feature.description}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        {/* Backend Stack */}
        <section className="about-section bg-light">
          <Container>
            <h2 className="section-title text-center mb-5">Backend Stack</h2>
            <Row className="justify-content-center">
              {backendStack.map((tech, index) => (
                <Col xs={6} sm={4} md={2} key={index} className="mb-4">
                  <div className="tech-card text-center">
                    <div className="tech-icon mb-2">{tech.icon}</div>
                    <h6 className="mb-1">{tech.name}</h6>
                    <small className="text-muted">{tech.description}</small>
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        {/* Frontend Stack */}
        <section className="about-section">
          <Container>
            <h2 className="section-title text-center mb-5">Frontend Stack</h2>
            <Row className="justify-content-center">
              {frontendStack.map((tech, index) => (
                <Col xs={6} sm={4} md={2} key={index} className="mb-4">
                  <div className="tech-card text-center">
                    <div className="tech-icon mb-2">{tech.icon}</div>
                    <h6 className="mb-1">{tech.name}</h6>
                    <small className="text-muted">{tech.description}</small>
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        {/* Infrastructure */}
        <section className="about-section bg-light">
          <Container>
            <h2 className="section-title text-center mb-5">Infrastructure</h2>
            <Row className="justify-content-center">
              {infrastructure.map((tech, index) => (
                <Col xs={6} sm={3} key={index} className="mb-4">
                  <div className="tech-card text-center">
                    <div className="tech-icon mb-2">{tech.icon}</div>
                    <h6 className="mb-1">{tech.name}</h6>
                    <small className="text-muted">{tech.description}</small>
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        {/* Architecture Highlights */}
        <section className="about-section">
          <Container>
            <h2 className="section-title text-center mb-5">Architecture Highlights</h2>
            <Row>
              <Col md={6} className="mb-4">
                <Card className="h-100">
                  <Card.Body>
                    <h5 className="card-title">Modular Monolith</h5>
                    <p className="text-muted">
                      Clean separation of concerns with 12+ modules: Auth, Catalog, Cart, Checkout,
                      Orders, Payment, Inventory, Booking, Wishlist, Notifications, Merchant, and Payout.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mb-4">
                <Card className="h-100">
                  <Card.Body>
                    <h5 className="card-title">Event-Driven with Outbox Pattern</h5>
                    <p className="text-muted">
                      Reliable event publishing using the transactional outbox pattern.
                      Events are never lost, even during failures.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mb-4">
                <Card className="h-100">
                  <Card.Body>
                    <h5 className="card-title">FSM-Based Order Management</h5>
                    <p className="text-muted">
                      Finite State Machine for order processing with separate flows for physical,
                      digital, and service products. Full audit trail included.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mb-4">
                <Card className="h-100">
                  <Card.Body>
                    <h5 className="card-title">Guest & Authenticated Shopping</h5>
                    <p className="text-muted">
                      Full shopping experience for guests with session-based cart persistence.
                      Seamless cart merging on login.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Footer */}
        <section className="about-footer text-center py-5">
          <Container>
            <p className="text-muted mb-0">
              Built with passion for modern web development.
            </p>
          </Container>
        </section>
      </div>

      <Footer />
    </>
  );
}

export default AboutPage;
