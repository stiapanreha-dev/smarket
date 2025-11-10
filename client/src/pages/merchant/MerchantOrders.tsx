import { Container } from 'react-bootstrap';
import { Card, Badge } from '../../components/common';

const MerchantOrders = () => {
  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">Merchant Orders</h1>
      {[1, 2, 3, 4, 5].map((order) => (
        <Card key={order} className="mb-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5>Order #{order}0001</h5>
                <p className="text-muted mb-2">Customer: John Doe</p>
                <Badge variant={order % 2 === 0 ? 'success' : 'warning'}>
                  {order % 2 === 0 ? 'Shipped' : 'Processing'}
                </Badge>
              </div>
              <div className="text-end">
                <h5 className="mb-2">$99.99</h5>
                <button className="btn btn-outline-primary btn-sm">
                  View Details
                </button>
              </div>
            </div>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
};

export default MerchantOrders;
