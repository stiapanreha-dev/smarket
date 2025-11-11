import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Alert, Breadcrumb } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Navbar, Footer } from '@/components/layout';
import { Button } from '@/components/common/Button';
import { useOrder, useCancelOrder } from '@/hooks/useOrders';
import {
  isOrderCancellable,
} from '@/types';
import { OrderStatusBadge } from '@/components/features/OrderStatusBadge';
import { OrderTimeline } from './components/OrderTimeline';
import { LineItemsSection } from './components/LineItemsSection';
import { ShippingPaymentInfo } from './components/ShippingPaymentInfo';
import { PricingSummary } from './components/PricingSummary';
import { CancelOrderModal } from './components/CancelOrderModal';
import './OrderDetailsPage.css';
import toast from 'react-hot-toast';

/**
 * Order Details Page Component
 *
 * Features:
 * - Order header with status and actions
 * - FSM-based order timeline
 * - Line items list with type-specific features
 * - Shipping & payment information
 * - Pricing summary
 * - Cancel order functionality
 * - Responsive design
 */
export function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // State
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch order data
  const { data: order, isLoading, error } = useOrder(id || '');

  // Cancel order mutation
  const cancelOrderMutation = useCancelOrder({
    onSuccess: () => {
      toast.success('Order cancelled successfully');
      setShowCancelModal(false);
    },
    onError: (error) => {
      toast.error(`Failed to cancel order: ${error.message}`);
    },
  });

  // Handlers
  const handleCancelOrder = (reason?: string) => {
    if (!order) return;
    cancelOrderMutation.mutate({
      orderId: order.id,
      data: reason ? { reason } : undefined,
    });
  };

  const handleDownloadInvoice = () => {
    // TODO: Implement invoice download
    toast.success('Invoice download coming soon!');
  };

  const handleContactSupport = () => {
    // TODO: Implement support contact
    toast.success('Support contact coming soon!');
  };

  const handleReorder = () => {
    // TODO: Implement reorder functionality
    toast.success('Reorder functionality coming soon!');
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Navbar />
        <Container className="py-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading order details...</p>
          </div>
        </Container>
        <Footer />
      </>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <>
        <Navbar />
        <Container className="py-4">
          <Alert variant="danger">
            <Alert.Heading>Error Loading Order</Alert.Heading>
            <p>{error?.message || 'Order not found'}</p>
            <hr />
            <div className="d-flex justify-content-end">
              <Button variant="outline-danger" onClick={() => navigate('/orders')}>
                Back to Orders
              </Button>
            </div>
          </Alert>
        </Container>
        <Footer />
      </>
    );
  }

  const orderDate = format(new Date(order.created_at), 'MMMM dd, yyyy');
  const canCancel = isOrderCancellable(order);

  return (
    <>
      <Navbar />
      <div className={`order-details-page ${isRTL ? 'rtl' : ''}`}>
        <Container className="py-4">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-4">
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
              Home
            </Breadcrumb.Item>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/orders' }}>
              My Orders
            </Breadcrumb.Item>
            <Breadcrumb.Item active>Order #{order.order_number}</Breadcrumb.Item>
          </Breadcrumb>

          {/* Order Header */}
          <Row className="mb-4">
            <Col>
              <div className="order-details-header">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div>
                    <h1 className="order-details-header__title">
                      Order #{order.order_number}
                    </h1>
                    <p className="text-muted mb-2">Placed on {orderDate}</p>
                    <OrderStatusBadge
                      status={order.status}
                      size="md"
                      className="order-details-header__badge"
                    />
                  </div>
                  {canCancel && (
                    <Button
                      variant="outline-danger"
                      onClick={() => setShowCancelModal(true)}
                    >
                      Cancel Order
                    </Button>
                  )}
                </div>
              </div>
            </Col>
          </Row>

          {/* Order Timeline */}
          <Row className="mb-4">
            <Col>
              <OrderTimeline order={order} />
            </Col>
          </Row>

          {/* Main Content */}
          <Row>
            {/* Left Column: Line Items & Shipping/Payment */}
            <Col xs={12} lg={8} className="mb-4">
              {/* Line Items */}
              <LineItemsSection order={order} />

              {/* Shipping & Payment Info */}
              <ShippingPaymentInfo order={order} />
            </Col>

            {/* Right Column: Pricing Summary & Actions */}
            <Col xs={12} lg={4}>
              {/* Pricing Summary */}
              <PricingSummary order={order} />

              {/* Action Buttons */}
              <div className="order-actions mt-3">
                <Button
                  variant="outline-primary"
                  fullWidth
                  className="mb-2"
                  onClick={handleDownloadInvoice}
                >
                  Download Invoice
                </Button>
                <Button
                  variant="outline-secondary"
                  fullWidth
                  className="mb-2"
                  onClick={handleContactSupport}
                >
                  Contact Support
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleReorder}
                >
                  Reorder
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      <Footer />

      {/* Cancel Order Modal */}
      <CancelOrderModal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        onConfirm={handleCancelOrder}
        loading={cancelOrderMutation.isPending}
        orderNumber={order.order_number}
      />
    </>
  );
}

export default OrderDetailsPage;
