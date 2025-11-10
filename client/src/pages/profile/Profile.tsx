import { Container, Row, Col } from 'react-bootstrap';
import { Card, Button, Input } from '../../components/common';

const Profile = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update logic
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">User Profile</h1>
      <Row>
        <Col lg={8}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Personal Information</h5>
              <form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Input label="First Name" defaultValue="John" required />
                  </Col>
                  <Col md={6}>
                    <Input label="Last Name" defaultValue="Doe" required />
                  </Col>
                </Row>
                <Input
                  label="Email"
                  type="email"
                  defaultValue="john.doe@example.com"
                  required
                />
                <Input
                  label="Phone"
                  type="tel"
                  defaultValue="+1 234 567 8900"
                />
                <div className="d-flex gap-2 mt-3">
                  <Button type="submit" variant="primary">
                    Save Changes
                  </Button>
                  <Button variant="outline-secondary">
                    Cancel
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Account Settings</h5>
              <div className="d-grid gap-2">
                <Button variant="outline-primary">
                  Change Password
                </Button>
                <Button variant="outline-primary">
                  Language & Region
                </Button>
                <Button variant="outline-danger">
                  Delete Account
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
