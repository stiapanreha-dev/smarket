import { useRouteError, Link, isRouteErrorResponse } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { Button } from '../components/common';

/**
 * ErrorPage - Error boundary for React Router
 * Catches errors during rendering, loading, or data fetching
 */
const ErrorPage = () => {
  const error = useRouteError();

  let errorMessage: string;
  let errorStatus: number | undefined;

  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || error.data?.message || 'An error occurred';
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = 'Unknown error occurred';
  }

  return (
    <Container className="text-center py-5">
      <div style={{ minHeight: '60vh' }} className="d-flex flex-column justify-content-center">
        {errorStatus && (
          <h1 className="display-1 fw-bold">{errorStatus}</h1>
        )}
        <h2 className="mb-4">Oops! Something went wrong</h2>
        <p className="text-muted mb-4">
          {errorMessage}
        </p>
        <div className="d-flex gap-2 justify-content-center">
          <Button as={Link} to="/" variant="primary">
            Go Back Home
          </Button>
          <Button variant="outline-secondary" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    </Container>
  );
};

export default ErrorPage;
