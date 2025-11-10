import { Link } from 'react-router-dom';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Button, Input } from '../../components/common';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement registration logic
  };

  return (
    <Row className="justify-content-center align-items-center min-vh-100">
      <Col md={6} lg={5}>
        <Card className="shadow-sm">
          <Card.Body className="p-4">
            <h2 className="text-center mb-4">Create Account</h2>
            <form onSubmit={handleSubmit}>
              <Input
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Choose a password"
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                required
              />
              <div className="d-grid gap-2 mt-4">
                <Button type="submit" variant="primary" size="lg">
                  Register
                </Button>
              </div>
            </form>
            <div className="text-center mt-3">
              <p className="text-muted">
                Already have an account?{' '}
                <Link to="/auth/login">Login here</Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default Register;
