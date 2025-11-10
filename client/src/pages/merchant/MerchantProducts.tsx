import { Container, Row, Col } from 'react-bootstrap';
import { Card, Button, Badge } from '../../components/common';

const MerchantProducts = () => {
  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">My Products</h1>
        <Button variant="primary">Add New Product</Button>
      </div>
      <Row>
        {[1, 2, 3, 4].map((product) => (
          <Col key={product} md={6} lg={4} className="mb-4">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5>Product {product}</h5>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-muted mb-2">Category: Electronics</p>
                <div className="d-flex justify-content-between align-items-center">
                  <strong>$99.99</strong>
                  <div className="d-flex gap-2">
                    <Button variant="outline-primary" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline-danger" size="sm">
                      Delete
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default MerchantProducts;
