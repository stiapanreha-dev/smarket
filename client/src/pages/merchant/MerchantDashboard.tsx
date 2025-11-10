import { Container, Row, Col } from 'react-bootstrap';
import { Card } from '../../components/common';
import { FiDollarSign, FiShoppingBag, FiPackage, FiTrendingUp } from 'react-icons/fi';

const MerchantDashboard = () => {
  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">Merchant Dashboard</h1>
      <Row>
        <Col md={3} className="mb-4">
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Total Revenue</p>
                  <h3 className="mb-0">$12,345</h3>
                </div>
                <FiDollarSign size={32} className="text-success" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Total Orders</p>
                  <h3 className="mb-0">234</h3>
                </div>
                <FiShoppingBag size={32} className="text-primary" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Total Products</p>
                  <h3 className="mb-0">56</h3>
                </div>
                <FiPackage size={32} className="text-info" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Growth</p>
                  <h3 className="mb-0">+23%</h3>
                </div>
                <FiTrendingUp size={32} className="text-warning" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col lg={8}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Recent Orders</h5>
              <p className="text-muted">Recent orders will be displayed here...</p>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Top Products</h5>
              <p className="text-muted">Top selling products will be displayed here...</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MerchantDashboard;
