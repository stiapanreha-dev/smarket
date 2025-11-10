import { Outlet, Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';

/**
 * AuthLayout - Minimal layout for authentication pages
 */
const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <div className="auth-header">
        <Container>
          <Link to="/" className="auth-logo">
            SNAILMARKETPLACE
          </Link>
        </Container>
      </div>
      <main className="auth-content">
        <Container>
          <Outlet />
        </Container>
      </main>
      <footer className="auth-footer">
        <Container>
          <p className="text-center text-muted">
            &copy; {new Date().getFullYear()} SnailMarketplace. All rights reserved.
          </p>
        </Container>
      </footer>
    </div>
  );
};

export default AuthLayout;
