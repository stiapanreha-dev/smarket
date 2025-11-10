import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar as BootstrapNavbar, Dropdown } from 'react-bootstrap';
import { FiHome, FiShoppingBag, FiPackage, FiBarChart, FiSettings, FiLogOut } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

/**
 * DashboardLayout - Layout for protected dashboard pages (Merchant/User)
 */
const DashboardLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // TODO: Implement logout logic
    localStorage.removeItem('token');
    navigate('/auth/login');
  };

  return (
    <div className="dashboard-layout">
      {/* Top Navbar */}
      <BootstrapNavbar bg="white" className="border-bottom" fixed="top">
        <Container fluid>
          <BootstrapNavbar.Brand as={Link} to="/">
            SNAILMARKETPLACE
          </BootstrapNavbar.Brand>

          <Nav className="ms-auto">
            <Dropdown align="end">
              <Dropdown.Toggle variant="link" className="text-decoration-none">
                User Profile
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/profile">
                  <FiSettings className="me-2" />
                  Profile Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <FiLogOut className="me-2" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Container>
      </BootstrapNavbar>

      <div className="dashboard-container" style={{ marginTop: '56px' }}>
        <div className="dashboard-sidebar">
          <Nav className="flex-column">
            <Nav.Link as={Link} to="/orders">
              <FiHome className="me-2" />
              My Orders
            </Nav.Link>
            <Nav.Link as={Link} to="/profile">
              <FiSettings className="me-2" />
              Profile
            </Nav.Link>

            {/* Merchant-specific links */}
            <div className="mt-4">
              <h6 className="px-3 text-muted small">MERCHANT</h6>
              <Nav.Link as={Link} to="/merchant/dashboard">
                <FiBarChart className="me-2" />
                Dashboard
              </Nav.Link>
              <Nav.Link as={Link} to="/merchant/products">
                <FiPackage className="me-2" />
                Products
              </Nav.Link>
              <Nav.Link as={Link} to="/merchant/orders">
                <FiShoppingBag className="me-2" />
                Orders
              </Nav.Link>
            </div>
          </Nav>
        </div>

        <main className="dashboard-main">
          <Container fluid>
            <Outlet />
          </Container>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
