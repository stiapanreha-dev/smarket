import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { Card, Badge } from '../../components/common';

const OrdersList = () => {
  return (
    <Container className="py-5">
      <h1 className="mb-4">My Orders</h1>
      <Row>
        {[1, 2, 3].map((order) => (
          <Col key={order} lg={12} className="mb-3">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5>Order #{order}0001</h5>
                    <p className="text-muted mb-2">Placed on: Jan {order}, 2025</p>
                    <Badge variant={order === 1 ? 'success' : 'warning'}>
                      {order === 1 ? 'Delivered' : 'In Progress'}
                    </Badge>
                  </div>
                  <div className="text-end">
                    <h5 className="mb-2">$99.99</h5>
                    <Link to={`/orders/${order}`} className="btn btn-outline-primary btn-sm">
                      View Details
                    </Link>
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

export default OrdersList;
