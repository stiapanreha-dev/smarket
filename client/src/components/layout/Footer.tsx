import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <Row>
          <Col lg={4} md={6} className="mb-4">
            <h4 className="footer-title">SnailMarketplace</h4>
            <p style={{ opacity: 0.85, fontSize: '14px', lineHeight: '1.6' }}>
              A modern modular marketplace platform built with NestJS, PostgreSQL, Redis, and S3.
              Supporting physical goods, digital products, and professional services.
            </p>
          </Col>

          <Col lg={2} md={6} className="mb-4">
            <h4 className="footer-title">Platform</h4>
            <a href="#services" className="footer-link">Services</a>
            <a href="#features" className="footer-link">Features</a>
            <a href="#pricing" className="footer-link">Pricing</a>
            <Link to="/about" className="footer-link">About Us</Link>
          </Col>

          <Col lg={2} md={6} className="mb-4">
            <h4 className="footer-title">Support</h4>
            <Link to="/docs" className="footer-link">Documentation</Link>
            <Link to="/docs/api" className="footer-link">API Reference</Link>
            <Link to="/docs/faq" className="footer-link">FAQ</Link>
            <a href="#contact" className="footer-link">Contact</a>
          </Col>

          <Col lg={2} md={6} className="mb-4">
            <h4 className="footer-title">Legal</h4>
            <a href="#privacy" className="footer-link">Privacy Policy</a>
            <a href="#terms" className="footer-link">Terms of Service</a>
            <a href="#cookies" className="footer-link">Cookie Policy</a>
          </Col>

          <Col lg={2} md={6} className="mb-4">
            <h4 className="footer-title">Connect</h4>
            <a href="#github" className="footer-link">GitHub</a>
            <a href="#twitter" className="footer-link">Twitter</a>
            <a href="#linkedin" className="footer-link">LinkedIn</a>
          </Col>
        </Row>

        <div className="footer-bottom">
          <p>&copy; {currentYear} SnailMarketplace. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
