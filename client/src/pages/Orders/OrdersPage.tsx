import { useState } from 'react';
import { Container, Row, Col, Nav, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Navbar, Footer } from '@/components/layout';
import { useOrders } from '@/hooks/useOrders';
import { OrderStatus, type OrderFilters } from '@/types';
import { OrderCard } from './components/OrderCard';
import { VirtualizedOrdersList } from './components/VirtualizedOrdersList';
import { EmptyOrders } from './components/EmptyOrders';
import { OrdersPageSkeleton } from './components/OrdersPageSkeleton';
import { Pagination } from './components/Pagination';
import './OrdersPage.css';

/**
 * Orders List Page Component
 *
 * Features:
 * - Tab-based filtering (All, Active, Completed, Cancelled)
 * - Order cards with thumbnails and status badges
 * - Pagination for large order lists
 * - Empty state with call-to-action
 * - Loading skeleton
 * - Sorting by newest first
 * - Multi-language support with RTL
 */
export function OrdersPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  // Tab state
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // Build filters based on active tab
  const filters: OrderFilters = {
    page: currentPage,
    limit,
  };

  if (activeTab === 'active') {
    // Active orders include pending, confirmed, and processing
    filters.status = OrderStatus.PROCESSING; // We'll need to handle multiple statuses
  } else if (activeTab === 'completed') {
    filters.status = OrderStatus.COMPLETED;
  } else if (activeTab === 'cancelled') {
    filters.status = OrderStatus.CANCELLED;
  }

  // Fetch orders
  const { data, isLoading, error } = useOrders(filters);

  // Handlers
  const handleTabChange = (tab: 'all' | 'active' | 'completed' | 'cancelled') => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  const handleOrderClick = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get orders data
  const orders = data?.data || [];
  const pagination = data?.pagination;

  return (
    <>
      <Navbar />
      <div className={`orders-page ${isRTL ? 'rtl' : ''}`}>
        <Container className="py-4">
          {/* Header */}
          <Row className="mb-4">
            <Col>
              <h1 className="orders-page__title">My Orders</h1>
            </Col>
          </Row>

          {/* Error Alert */}
          {error && (
            <Alert variant="danger" className="mb-4">
              <Alert.Heading>Error Loading Orders</Alert.Heading>
              <p>{error.message || 'Failed to load orders. Please try again later.'}</p>
            </Alert>
          )}

          {/* Filter Tabs */}
          <Row className="mb-4">
            <Col>
              <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => handleTabChange(k as any)}>
                <Nav.Item>
                  <Nav.Link eventKey="all">All</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="active">Active</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="completed">Completed</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="cancelled">Cancelled</Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
          </Row>

          {/* Loading State */}
          {isLoading && <OrdersPageSkeleton />}

          {/* Empty State */}
          {!isLoading && orders.length === 0 && <EmptyOrders />}

          {/* Orders List */}
          {!isLoading && orders.length > 0 && (
            <>
              <Row>
                <Col>
                  {/* Use virtualized list for better performance with many orders */}
                  {pagination && pagination.total > 50 ? (
                    <VirtualizedOrdersList
                      orders={orders}
                      onOrderClick={handleOrderClick}
                    />
                  ) : (
                    <div className="orders-list">
                      {orders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onClick={() => handleOrderClick(order.id)}
                        />
                      ))}
                    </div>
                  )}
                </Col>
              </Row>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <Row className="mt-4">
                  <Col>
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.pages}
                      onPageChange={handlePageChange}
                    />
                  </Col>
                </Row>
              )}
            </>
          )}
        </Container>
      </div>
      <Footer />
    </>
  );
}

export default OrdersPage;
