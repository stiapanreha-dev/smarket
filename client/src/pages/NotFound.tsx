import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { Button } from '../components/common';

const NotFound = () => {
  return (
    <Container className="text-center py-5">
      <div style={{ minHeight: '60vh' }} className="d-flex flex-column justify-content-center">
        <h1 className="display-1 fw-bold">404</h1>
        <h2 className="mb-4">Page Not Found</h2>
        <p className="text-muted mb-4">
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable.
        </p>
        <div>
          <Button as={Link} to="/" variant="primary" size="lg">
            Go Back Home
          </Button>
        </div>
      </div>
    </Container>
  );
};

export default NotFound;
