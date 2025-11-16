/**
 * Merchant Dashboard Page
 *
 * Main dashboard page for merchants with:
 * - KPI Statistics Cards
 * - Revenue Chart (last 7 days)
 * - Orders by Status Chart
 * - Top Selling Products Chart
 * - Recent Orders Table
 *
 * Protected route - requires merchant role
 */

import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useDashboardStats } from '@/hooks';
import {
  MerchantSidebar,
  StatsCards,
  RevenueChart,
  OrdersByStatusChart,
  TopProductsChart,
  RecentOrdersTable,
} from './components';
import './DashboardPage.css';

export const DashboardPage = () => {
  const { t } = useTranslation('merchant');
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="merchant-layout">
        <Container fluid>
          <Row>
            <Col md={2} className="p-0">
              <MerchantSidebar />
            </Col>
            <Col md={10}>
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <div className="text-center">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">{t('dashboard.loading')}</p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="merchant-layout">
        <Container fluid>
          <Row>
            <Col md={2} className="p-0">
              <MerchantSidebar />
            </Col>
            <Col md={10}>
              <Container className="py-5">
                <Alert variant="danger">
                  <Alert.Heading>{t('dashboard.error')}</Alert.Heading>
                  <p className="mb-0">
                    {error instanceof Error ? error.message : t('dashboard.errorMessage')}
                  </p>
                </Alert>
              </Container>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="merchant-layout">
        <Container fluid>
          <Row>
            <Col md={2} className="p-0">
              <MerchantSidebar />
            </Col>
            <Col md={10}>
              <Container className="py-5">
                <Alert variant="info">
                  <p className="mb-0">{t('dashboard.noData')}</p>
                </Alert>
              </Container>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="merchant-layout">
      <Container fluid>
        <Row>
          {/* Sidebar */}
          <Col md={2} className="p-0">
            <MerchantSidebar />
          </Col>

          {/* Main Content */}
          <Col md={10} className="dashboard-content">
            <Container fluid className="py-4">
              {/* Page Header */}
              <div className="mb-4">
                <h2 className="fw-bold">{t('dashboard.title')}</h2>
                <p className="text-muted mb-0">{t('dashboard.welcome')}</p>
              </div>

              {/* Statistics Cards */}
              <StatsCards stats={stats} />

              {/* Charts Row */}
              <Row className="g-3 mb-4">
                <Col lg={8}>
                  <RevenueChart data={stats.revenue_chart} />
                </Col>
                <Col lg={4}>
                  <OrdersByStatusChart data={stats.orders_by_status} />
                </Col>
              </Row>

              {/* Top Products Chart */}
              <Row className="g-3 mb-4">
                <Col xs={12}>
                  <TopProductsChart data={stats.top_products} />
                </Col>
              </Row>

              {/* Recent Orders Table */}
              <Row className="g-3">
                <Col xs={12}>
                  <RecentOrdersTable orders={stats.recent_orders} />
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
