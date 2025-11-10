import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { Card, Button } from '../../components/common';

const Cart = () => {
  return (
    <Container className="py-5">
      <h1 className="mb-4">Shopping Cart</h1>
      <Row>
        <Col lg={8}>
          <Card className="mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5>Product Name</h5>
                  <p className="text-muted mb-0">$99.99</p>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span>Qty: 1</span>
                  <Button variant="outline-danger" size="sm">
                    Remove
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Order Summary</h5>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <strong>$99.99</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Tax:</span>
                <strong>$10.00</strong>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong>Total:</strong>
                <strong>$109.99</strong>
              </div>
              <div className="d-grid gap-2">
                <Button as={Link} to="/checkout" variant="primary" size="lg">
                  Proceed to Checkout
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart;
