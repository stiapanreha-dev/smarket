import { Link } from 'react-router-dom';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Button, Input } from '../../components/common';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login logic
  };

  return (
    <Row className="justify-content-center align-items-center min-vh-100">
      <Col md={6} lg={5}>
        <Card className="shadow-sm">
          <Card.Body className="p-4">
            <h2 className="text-center mb-4">Login to SnailMarketplace</h2>
            <form onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                required
              />
              <div className="d-grid gap-2 mt-4">
                <Button type="submit" variant="primary" size="lg">
                  Login
                </Button>
              </div>
            </form>
            <div className="text-center mt-3">
              <p className="text-muted">
                Don't have an account?{' '}
                <Link to="/auth/register">Register here</Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default Login;
