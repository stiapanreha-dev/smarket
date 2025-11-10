import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { Card, Badge } from '../../components/common';

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Container className="py-5">
      <Link to="/orders" className="text-decoration-none mb-3 d-inline-block">
        &larr; Back to Orders
      </Link>
      <h1 className="mb-4">Order #{id}0001</h1>
      <Row>
        <Col lg={8}>
          <Card className="mb-3">
            <Card.Body>
              <h5 className="mb-3">Order Items</h5>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                <div>
                  <h6>Product Name</h6>
                  <p className="text-muted mb-0">Quantity: 1</p>
                </div>
                <strong>$99.99</strong>
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Shipping Address</h5>
              <p className="mb-0">
                John Doe<br />
                123 Main Street<br />
                New York, NY 10001
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="mb-3">
            <Card.Body>
              <h5 className="mb-3">Order Status</h5>
              <Badge variant="success" className="mb-3">Delivered</Badge>
              <p className="text-muted small mb-0">Delivered on Jan 5, 2025</p>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Order Summary</h5>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <strong>$99.99</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping:</span>
                <strong>$5.00</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Tax:</span>
                <strong>$10.00</strong>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Total:</strong>
                <strong>$114.99</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderDetails;
