import { Container, Row, Col } from 'react-bootstrap';
import { Alert } from './common/Alert';
import { Badge } from './common/Badge';
import { Button } from './common/Button';
import { Card } from './common/Card';
import { LoadingSpinner } from './common/LoadingSpinner';

const ComponentShowcase = () => {
  return (
    <section className="component-showcase py-5" style={{ backgroundColor: '#f8f9fa' }}>
      <Container>
        <div className="text-center mb-5">
          <h2 className="mb-3">UI Components Showcase</h2>
          <p className="text-muted">
            Explore our new professional UI components
          </p>
        </div>

        {/* Alerts Section */}
        <Row className="mb-4">
          <Col>
            <h4 className="mb-3">Alerts</h4>
            <Alert variant="success" title="Success!" className="mb-3">
              Your changes have been saved successfully.
            </Alert>
            <Alert variant="info" title="Information" dismissible className="mb-3">
              Check out our new features and improvements.
            </Alert>
            <Alert variant="warning" className="mb-3">
              Your session will expire in 5 minutes.
            </Alert>
          </Col>
        </Row>

        {/* Badges Section */}
        <Row className="mb-4">
          <Col>
            <h4 className="mb-3">Badges</h4>
            <div className="d-flex flex-wrap gap-2">
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="danger">Error</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="secondary" pill>Pill Badge</Badge>
              <Badge variant="dark" dot>With Dot</Badge>
            </div>
          </Col>
        </Row>

        {/* Buttons Section */}
        <Row className="mb-4">
          <Col>
            <h4 className="mb-3">Buttons</h4>
            <div className="d-flex flex-wrap gap-2 mb-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success">Success</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="outline-primary">Outline</Button>
              <Button variant="primary" size="lg">Large</Button>
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" loading>Loading...</Button>
            </div>
          </Col>
        </Row>

        {/* Cards Section */}
        <Row className="mb-4">
          <Col md={4}>
            <Card
              title="Card with Image"
              image="https://picsum.photos/400/200"
              imageHeight="200px"
              hoverable
              className="mb-3"
            >
              This is a beautiful card component with an image. Hover over it to see the effect!
            </Card>
          </Col>
          <Col md={4}>
            <Card
              title="Feature Card"
              subtitle="Premium Feature"
              border="primary"
              className="mb-3"
            >
              <p>Explore premium features with our professional card design.</p>
              <Button variant="primary" size="sm">Learn More</Button>
            </Card>
          </Col>
          <Col md={4}>
            <Card
              header={<Badge variant="success">New</Badge>}
              title="Latest Product"
              footer={
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">$99.99</span>
                  <Button variant="primary" size="sm">Buy Now</Button>
                </div>
              }
              className="mb-3"
            >
              Check out our latest product with amazing features!
            </Card>
          </Col>
        </Row>

        {/* Loading Spinner */}
        <Row>
          <Col>
            <h4 className="mb-3">Loading States</h4>
            <div className="d-flex flex-wrap gap-4 align-items-center">
              <LoadingSpinner variant="primary" />
              <LoadingSpinner variant="success" animation="grow" />
              <LoadingSpinner variant="danger" size="sm" />
              <LoadingSpinner variant="info" text="Loading..." />
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default ComponentShowcase;
