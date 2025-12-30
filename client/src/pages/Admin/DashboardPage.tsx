import { Container, Row, Col, Card, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  FaUsers,
  FaShoppingCart,
  FaDollarSign,
  FaUserTie,
  FaClipboardList,
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaCog,
} from 'react-icons/fa';
import { getDashboardStats } from '@/api/admin.api';
import { Navbar, Footer } from '@/components/layout';
import './DashboardPage.css';

export function DashboardPage() {
  const { t } = useTranslation();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: getDashboardStats,
    refetchInterval: 60000, // Refresh every minute
  });

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100); // Convert from minor units
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'primary',
      completed: 'success',
      cancelled: 'danger',
      refunded: 'secondary',
    };
    return <Badge bg={colors[status] || 'secondary'}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <Container className="admin-dashboard py-4">
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading dashboard...</p>
          </div>
        </Container>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Container className="admin-dashboard py-4">
          <Alert variant="danger">
            <h4>Error loading dashboard</h4>
            <p>{error instanceof Error ? error.message : 'Failed to load dashboard data'}</p>
          </Alert>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container className="admin-dashboard py-4">
        <h1 className="mb-4">Admin Dashboard</h1>

        {/* Stats Cards */}
        <Row className="g-4 mb-4">
          {/* Users Card */}
          <Col xs={12} sm={6} lg={3}>
            <Card className="stat-card h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="stat-label">Total Users</p>
                    <h3 className="stat-value">{stats?.users.total || 0}</h3>
                    <p className="stat-subtitle">
                      +{stats?.users.newToday || 0} today
                    </p>
                  </div>
                  <div className="stat-icon users">
                    <FaUsers />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Orders Card */}
          <Col xs={12} sm={6} lg={3}>
            <Card className="stat-card h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="stat-label">Total Orders</p>
                    <h3 className="stat-value">{stats?.orders.total || 0}</h3>
                    <p className="stat-subtitle">
                      +{stats?.orders.today || 0} today
                    </p>
                  </div>
                  <div className="stat-icon orders">
                    <FaShoppingCart />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Revenue Card */}
          <Col xs={12} sm={6} lg={3}>
            <Card className="stat-card h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="stat-label">Total Revenue</p>
                    <h3 className="stat-value">
                      {formatCurrency(stats?.revenue.total || 0, stats?.revenue.currency)}
                    </h3>
                    <p className="stat-subtitle">All time</p>
                  </div>
                  <div className="stat-icon revenue">
                    <FaDollarSign />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Pending Applications Card */}
          <Col xs={12} sm={6} lg={3}>
            <Card className="stat-card h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="stat-label">Pending Applications</p>
                    <h3 className="stat-value">{stats?.pendingMerchantApplications || 0}</h3>
                    <p className="stat-subtitle">Merchant requests</p>
                  </div>
                  <div className="stat-icon applications">
                    <FaUserTie />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Secondary Stats Row */}
        <Row className="g-4 mb-4">
          {/* Users by Role */}
          <Col xs={12} md={6} lg={4}>
            <Card className="h-100">
              <Card.Header>
                <FaUsers className="me-2" />
                Users by Role
              </Card.Header>
              <Card.Body>
                <div className="role-stats">
                  <div className="role-stat">
                    <span className="role-label">Buyers</span>
                    <Badge bg="secondary" className="role-count">
                      {stats?.users.byRole?.buyer || 0}
                    </Badge>
                  </div>
                  <div className="role-stat">
                    <span className="role-label">Merchants</span>
                    <Badge bg="primary" className="role-count">
                      {stats?.users.byRole?.merchant || 0}
                    </Badge>
                  </div>
                  <div className="role-stat">
                    <span className="role-label">Admins</span>
                    <Badge bg="danger" className="role-count">
                      {stats?.users.byRole?.admin || 0}
                    </Badge>
                  </div>
                </div>
                <hr />
                <p className="mb-0 text-muted small">
                  <strong>+{stats?.users.newThisWeek || 0}</strong> new users this week
                </p>
              </Card.Body>
            </Card>
          </Col>

          {/* Orders by Status */}
          <Col xs={12} md={6} lg={4}>
            <Card className="h-100">
              <Card.Header>
                <FaClipboardList className="me-2" />
                Orders by Status
              </Card.Header>
              <Card.Body>
                <div className="order-stats">
                  <div className="order-stat">
                    <FaClock className="text-warning me-2" />
                    <span className="order-label">Pending</span>
                    <Badge bg="warning" className="order-count">
                      {stats?.orders.pending || 0}
                    </Badge>
                  </div>
                  <div className="order-stat">
                    <FaSpinner className="text-primary me-2" />
                    <span className="order-label">Processing</span>
                    <Badge bg="primary" className="order-count">
                      {stats?.orders.processing || 0}
                    </Badge>
                  </div>
                  <div className="order-stat">
                    <FaCheckCircle className="text-success me-2" />
                    <span className="order-label">Completed</span>
                    <Badge bg="success" className="order-count">
                      {stats?.orders.completed || 0}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Quick Actions */}
          <Col xs={12} md={12} lg={4}>
            <Card className="h-100">
              <Card.Header>Quick Actions</Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Link to="/admin/users" className="btn btn-outline-primary">
                    <FaUsers className="me-2" />
                    Manage Users
                  </Link>
                  <Link to="/admin/settings" className="btn btn-outline-primary">
                    <FaCog className="me-2" />
                    Platform Settings
                  </Link>
                  {/* <Link to="/admin/merchant-applications" className="btn btn-outline-primary">
                    <FaUserTie className="me-2" />
                    Review Applications
                  </Link> */}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Orders Table */}
        <Card>
          <Card.Header>
            <FaShoppingCart className="me-2" />
            Recent Orders
          </Card.Header>
          <Card.Body>
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link to={`/orders/${order.id}`}>
                          {order.order_number}
                        </Link>
                      </td>
                      <td>
                        {order.customer ? (
                          <>
                            <div>{order.customer.name || 'N/A'}</div>
                            <small className="text-muted">{order.customer.email}</small>
                          </>
                        ) : (
                          <span className="text-muted">Guest</span>
                        )}
                      </td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td>{formatCurrency(order.total_amount, order.currency)}</td>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="text-center text-muted py-3 mb-0">No orders yet</p>
            )}
          </Card.Body>
        </Card>
      </Container>
      <Footer />
    </>
  );
}

export default DashboardPage;
