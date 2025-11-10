import { Container, Row, Col } from 'react-bootstrap';
import { Card, Button, Input } from '../../components/common';

const Checkout = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement checkout logic
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">Checkout</h1>
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Shipping Information</h5>
              <form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Input label="First Name" required />
                  </Col>
                  <Col md={6}>
                    <Input label="Last Name" required />
                  </Col>
                </Row>
                <Input label="Address" required />
                <Row>
                  <Col md={6}>
                    <Input label="City" required />
                  </Col>
                  <Col md={6}>
                    <Input label="ZIP Code" required />
                  </Col>
                </Row>
              </form>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Payment Information</h5>
              <Input label="Card Number" placeholder="1234 5678 9012 3456" required />
              <Row>
                <Col md={6}>
                  <Input label="Expiry Date" placeholder="MM/YY" required />
                </Col>
                <Col md={6}>
                  <Input label="CVV" placeholder="123" required />
                </Col>
              </Row>
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
                <span>Shipping:</span>
                <strong>$5.00</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Tax:</span>
                <strong>$10.00</strong>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong>Total:</strong>
                <strong>$114.99</strong>
              </div>
              <div className="d-grid gap-2">
                <Button variant="primary" size="lg">
                  Place Order
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Checkout;
