import { useState } from 'react';
import { Container, Row, Col, Offcanvas, Button } from 'react-bootstrap';
import { FaBars } from 'react-icons/fa';
import { Navbar, Footer } from '@/components/layout';
import { SEO } from '@/components/SEO';
import { DocsSidebar } from './DocsSidebar';
import '../DocsPage.css';

interface DocsLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function DocsLayout({ children, title, description }: DocsLayoutProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <>
      <SEO
        title={`${title} - Documentation | SnailMarketplace`}
        description={description || `${title} - SnailMarketplace Documentation`}
      />
      <Navbar />

      <div className="docs-page">
        <Container fluid>
          <Row>
            {/* Desktop Sidebar */}
            <Col lg={3} xl={2} className="docs-sidebar-wrapper d-none d-lg-block">
              <div className="docs-sidebar-sticky">
                <DocsSidebar />
              </div>
            </Col>

            {/* Mobile Sidebar Toggle */}
            <div className="docs-mobile-toggle d-lg-none">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowMobileSidebar(true)}
              >
                <FaBars className="me-2" />
                Menu
              </Button>
            </div>

            {/* Mobile Sidebar Offcanvas */}
            <Offcanvas
              show={showMobileSidebar}
              onHide={() => setShowMobileSidebar(false)}
              placement="start"
              className="docs-offcanvas"
            >
              <Offcanvas.Header closeButton>
                <Offcanvas.Title>Documentation</Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body>
                <DocsSidebar onNavigate={() => setShowMobileSidebar(false)} />
              </Offcanvas.Body>
            </Offcanvas>

            {/* Main Content */}
            <Col lg={9} xl={10} className="docs-content-wrapper">
              <div className="docs-content">
                {children}
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Footer />
    </>
  );
}

export default DocsLayout;
