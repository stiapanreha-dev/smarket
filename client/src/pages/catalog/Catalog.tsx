import { Container, Row, Col } from 'react-bootstrap';
import { Card, Button } from '../../components/common';

const Catalog = () => {
  return (
    <Container className="py-5">
      <h1 className="mb-4">Product Catalog</h1>
      <Row>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Col key={item} md={4} className="mb-4">
            <Card>
              <Card.Body>
                <h5>Product {item}</h5>
                <p className="text-muted">Product description goes here</p>
                <div className="d-flex justify-content-between align-items-center">
                  <strong>$99.99</strong>
                  <Button variant="primary" size="sm">
                    View Details
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Catalog;
