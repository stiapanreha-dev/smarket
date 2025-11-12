/**
 * Merchant Orders Page
 *
 * Orders management page for merchants with:
 * - Order tabs by status
 * - Orders table with actions
 * - Filters (date range, search)
 * - Quick actions (update status, add tracking)
 * - Bulk actions (export CSV, print labels)
 * - Order details modal
 *
 * Protected route - requires merchant role
 */

import { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  InputGroup,
  Table,
  Badge,
  Spinner,
  Alert,
  Modal,
  Pagination,
  Dropdown,
  Tabs,
  Tab,
  Offcanvas,
} from 'react-bootstrap';
import { MerchantSidebar } from './components';
import {
  Order,
  OrderLineItem,
  PhysicalItemStatus,
  DigitalItemStatus,
  ServiceItemStatus,
  getCustomerName,
  formatOrderTotal,
  LineItemType,
} from '@/types/order';
import {
  useMerchantOrders,
  useUpdateOrderStatus,
  useAddTrackingNumber,
  useExportOrdersCSV,
} from '@/hooks';
import './OrdersPage.css';

// Tab configuration
const ORDER_TABS = [
  {
    key: 'new',
    title: 'New',
    statuses: [PhysicalItemStatus.PENDING, PhysicalItemStatus.PAYMENT_CONFIRMED],
  },
  {
    key: 'processing',
    title: 'Processing',
    statuses: [PhysicalItemStatus.PREPARING],
  },
  {
    key: 'shipped',
    title: 'Shipped',
    statuses: [PhysicalItemStatus.SHIPPED, PhysicalItemStatus.OUT_FOR_DELIVERY],
  },
  {
    key: 'completed',
    title: 'Completed',
    statuses: [PhysicalItemStatus.DELIVERED],
  },
  {
    key: 'cancelled',
    title: 'Cancelled',
    statuses: [PhysicalItemStatus.CANCELLED],
  },
];

export const OrdersPage = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('new');

  // Filters state
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Selected orders for bulk actions
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Order details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Tracking number modal
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');

  // Get current tab statuses
  const currentTabStatuses = ORDER_TABS.find((t) => t.key === activeTab)?.statuses || [];

  // Fetch orders with filters
  const { data, isLoading, error } = useMerchantOrders({
    status: currentTabStatuses.join(','),
    search: search || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    limit,
  });

  // Mutations
  const updateStatusMutation = useUpdateOrderStatus();
  const addTrackingMutation = useAddTrackingNumber();
  const exportCSVMutation = useExportOrdersCSV();

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleTabChange = (tab: string | null) => {
    if (tab) {
      setActiveTab(tab);
      setPage(1);
      setSelectedOrders(new Set());
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && data?.data) {
      setSelectedOrders(new Set(data.data.map((o) => o.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        data: { status },
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleShowTracking = (order: Order) => {
    setTrackingOrder(order);
    setShowTrackingModal(true);
  };

  const handleAddTracking = async () => {
    if (!trackingOrder || !trackingNumber) return;

    try {
      await addTrackingMutation.mutateAsync({
        orderId: trackingOrder.id,
        data: {
          tracking_number: trackingNumber,
          carrier: carrier || undefined,
        },
      });
      setShowTrackingModal(false);
      setTrackingNumber('');
      setCarrier('');
      setTrackingOrder(null);
    } catch (err) {
      console.error('Failed to add tracking:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportCSVMutation.mutateAsync({
        status: currentTabStatuses.join(','),
        search: search || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  const handlePrintLabels = () => {
    // TODO: Implement print labels
    console.log('Print labels for selected orders:', selectedOrders);
  };

  // Utility functions
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'secondary',
      payment_confirmed: 'info',
      preparing: 'warning',
      ready_to_ship: 'primary',
      shipped: 'primary',
      out_for_delivery: 'primary',
      delivered: 'success',
      cancelled: 'danger',
      refunded: 'dark',
    };

    const variant = variants[status] || 'secondary';
    const displayStatus = status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return <Badge bg={variant}>{displayStatus}</Badge>;
  };

  const formatPrice = (amountMinor: number, currency: string) => {
    const amount = amountMinor / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProductsSummary = (lineItems: OrderLineItem[]) => {
    if (!lineItems || lineItems.length === 0) return 'No items';
    if (lineItems.length === 1)
      return `${lineItems[0].product_name} (x${lineItems[0].quantity})`;
    return `${lineItems[0].product_name} +${lineItems.length - 1} more`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="merchant-layout">
        <Container fluid>
          <Row>
            <Col md={2} className="p-0">
              <MerchantSidebar />
            </Col>
            <Col md={10}>
              <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: '80vh' }}
              >
                <div className="text-center">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Loading orders...</p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  // Error state
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
                  <Alert.Heading>Error Loading Orders</Alert.Heading>
                  <p className="mb-0">
                    {error instanceof Error
                      ? error.message
                      : 'Failed to load orders. Please try again later.'}
                  </p>
                </Alert>
              </Container>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  const orders = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="merchant-layout">
      <Container fluid>
        <Row>
          {/* Sidebar */}
          <Col md={2} className="p-0">
            <MerchantSidebar />
          </Col>

          {/* Main Content */}
          <Col md={10} className="orders-content">
            <Container fluid className="py-4">
              {/* Page Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h2 className="fw-bold mb-0">Orders</h2>
                  <p className="text-muted mb-0">Manage your customer orders</p>
                </div>
              </div>

              {/* Filters */}
              <Row className="mb-4">
                <Col md={4}>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by order # or customer..."
                      value={search}
                      onChange={handleSearchChange}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Control
                    type="date"
                    placeholder="From date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                  />
                </Col>
                <Col md={3}>
                  <Form.Control
                    type="date"
                    placeholder="To date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                  />
                </Col>
                <Col md={2}>
                  <Button
                    variant="outline-secondary"
                    className="w-100"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                      setSearch('');
                      setPage(1);
                    }}
                  >
                    Clear
                  </Button>
                </Col>
              </Row>

              {/* Bulk Actions */}
              {selectedOrders.size > 0 && (
                <div className="mb-3">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={handleExportCSV}
                  >
                    <i className="bi bi-download me-2"></i>
                    Export CSV ({selectedOrders.size})
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={handlePrintLabels}
                  >
                    <i className="bi bi-printer me-2"></i>
                    Print Labels ({selectedOrders.size})
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setSelectedOrders(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}

              {/* Order Tabs */}
              <Tabs
                activeKey={activeTab}
                onSelect={handleTabChange}
                className="mb-3"
              >
                {ORDER_TABS.map((tab) => (
                  <Tab key={tab.key} eventKey={tab.key} title={tab.title}>
                    {/* Orders Table */}
                    {orders.length === 0 ? (
                      <div className="text-center py-5">
                        <div className="mb-3">
                          <i
                            className="bi bi-inbox"
                            style={{ fontSize: '4rem', color: '#ccc' }}
                          ></i>
                        </div>
                        <h4>No orders found</h4>
                        <p className="text-muted">
                          {search || dateFrom || dateTo
                            ? 'Try adjusting your filters'
                            : 'Orders will appear here when customers place them'}
                        </p>
                      </div>
                    ) : (
                      <>
                        <Table responsive hover className="orders-table">
                          <thead>
                            <tr>
                              <th style={{ width: '50px' }}>
                                <Form.Check
                                  type="checkbox"
                                  checked={
                                    orders.length > 0 &&
                                    selectedOrders.size === orders.length
                                  }
                                  onChange={handleSelectAll}
                                />
                              </th>
                              <th>Order #</th>
                              <th>Customer</th>
                              <th>Products</th>
                              <th>Total</th>
                              <th>Status</th>
                              <th>Date</th>
                              <th style={{ width: '150px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((order) => (
                              <tr key={order.id}>
                                <td>
                                  <Form.Check
                                    type="checkbox"
                                    checked={selectedOrders.has(order.id)}
                                    onChange={() => handleSelectOrder(order.id)}
                                  />
                                </td>
                                <td>
                                  <div className="fw-semibold">
                                    #{order.order_number}
                                  </div>
                                </td>
                                <td>
                                  <div>{getCustomerName(order)}</div>
                                  <small className="text-muted">
                                    {order.customer_email || order.guest_email}
                                  </small>
                                </td>
                                <td>
                                  <small>
                                    {getProductsSummary(order.line_items)}
                                  </small>
                                </td>
                                <td>
                                  {formatPrice(order.total_amount, order.currency)}
                                </td>
                                <td>
                                  {getStatusBadge(
                                    order.line_items[0]?.status || 'pending'
                                  )}
                                </td>
                                <td>
                                  <small>{formatDate(order.created_at)}</small>
                                </td>
                                <td>
                                  <Dropdown>
                                    <Dropdown.Toggle
                                      variant="outline-secondary"
                                      size="sm"
                                      id={`dropdown-${order.id}`}
                                    >
                                      Actions
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                      <Dropdown.Item
                                        onClick={() => handleViewDetails(order)}
                                      >
                                        <i className="bi bi-eye me-2"></i>
                                        View Details
                                      </Dropdown.Item>
                                      <Dropdown.Divider />
                                      {activeTab === 'new' && (
                                        <Dropdown.Item
                                          onClick={() =>
                                            handleUpdateStatus(
                                              order.id,
                                              PhysicalItemStatus.PREPARING
                                            )
                                          }
                                        >
                                          <i className="bi bi-box-seam me-2"></i>
                                          Mark as Preparing
                                        </Dropdown.Item>
                                      )}
                                      {activeTab === 'processing' && (
                                        <Dropdown.Item
                                          onClick={() =>
                                            handleShowTracking(order)
                                          }
                                        >
                                          <i className="bi bi-truck me-2"></i>
                                          Mark as Shipped
                                        </Dropdown.Item>
                                      )}
                                      <Dropdown.Item
                                        onClick={() =>
                                          handleUpdateStatus(
                                            order.id,
                                            PhysicalItemStatus.CANCELLED
                                          )
                                        }
                                        className="text-danger"
                                      >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Cancel Order
                                      </Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>

                        {/* Pagination */}
                        {pagination && pagination.pages > 1 && (
                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <div className="text-muted">
                              Showing {(page - 1) * limit + 1} to{' '}
                              {Math.min(page * limit, pagination.total)} of{' '}
                              {pagination.total} orders
                            </div>
                            <Pagination>
                              <Pagination.First
                                onClick={() => setPage(1)}
                                disabled={page === 1}
                              />
                              <Pagination.Prev
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                              />
                              {[...Array(pagination.pages)].map((_, idx) => {
                                const pageNum = idx + 1;
                                if (
                                  pageNum === 1 ||
                                  pageNum === pagination.pages ||
                                  (pageNum >= page - 1 && pageNum <= page + 1)
                                ) {
                                  return (
                                    <Pagination.Item
                                      key={pageNum}
                                      active={pageNum === page}
                                      onClick={() => setPage(pageNum)}
                                    >
                                      {pageNum}
                                    </Pagination.Item>
                                  );
                                } else if (
                                  pageNum === page - 2 ||
                                  pageNum === page + 2
                                ) {
                                  return <Pagination.Ellipsis key={pageNum} />;
                                }
                                return null;
                              })}
                              <Pagination.Next
                                onClick={() => setPage(page + 1)}
                                disabled={page === pagination.pages}
                              />
                              <Pagination.Last
                                onClick={() => setPage(pagination.pages)}
                                disabled={page === pagination.pages}
                              />
                            </Pagination>
                          </div>
                        )}
                      </>
                    )}
                  </Tab>
                ))}
              </Tabs>
            </Container>
          </Col>
        </Row>
      </Container>

      {/* Order Details Modal */}
      <Offcanvas
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        placement="end"
        style={{ width: '600px' }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            Order #{selectedOrder?.order_number}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {selectedOrder && (
            <div>
              {/* Order Info */}
              <div className="mb-4">
                <h5>Order Information</h5>
                <div className="border rounded p-3">
                  <Row className="mb-2">
                    <Col xs={5} className="text-muted">
                      Status:
                    </Col>
                    <Col xs={7}>
                      {getStatusBadge(
                        selectedOrder.line_items[0]?.status || 'pending'
                      )}
                    </Col>
                  </Row>
                  <Row className="mb-2">
                    <Col xs={5} className="text-muted">
                      Date:
                    </Col>
                    <Col xs={7}>{formatDate(selectedOrder.created_at)}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col xs={5} className="text-muted">
                      Payment:
                    </Col>
                    <Col xs={7}>
                      <Badge bg="success">{selectedOrder.payment_status}</Badge>
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={5} className="text-muted">
                      Total:
                    </Col>
                    <Col xs={7} className="fw-bold">
                      {formatPrice(
                        selectedOrder.total_amount,
                        selectedOrder.currency
                      )}
                    </Col>
                  </Row>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-4">
                <h5>Customer Contact</h5>
                <div className="border rounded p-3">
                  <div className="mb-2">
                    <strong>{getCustomerName(selectedOrder)}</strong>
                  </div>
                  <div className="text-muted">
                    {selectedOrder.customer_email || selectedOrder.guest_email}
                  </div>
                  {selectedOrder.guest_phone && (
                    <div className="text-muted">{selectedOrder.guest_phone}</div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shipping_address && (
                <div className="mb-4">
                  <h5>Shipping Address</h5>
                  <div className="border rounded p-3">
                    <div>{selectedOrder.shipping_address.street}</div>
                    {selectedOrder.shipping_address.street2 && (
                      <div>{selectedOrder.shipping_address.street2}</div>
                    )}
                    <div>
                      {selectedOrder.shipping_address.city},{' '}
                      {selectedOrder.shipping_address.state}{' '}
                      {selectedOrder.shipping_address.postal_code}
                    </div>
                    <div>{selectedOrder.shipping_address.country}</div>
                    {selectedOrder.shipping_address.phone && (
                      <div className="mt-2 text-muted">
                        Phone: {selectedOrder.shipping_address.phone}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Line Items */}
              <div className="mb-4">
                <h5>Order Items</h5>
                {selectedOrder.line_items.map((item) => (
                  <div key={item.id} className="border rounded p-3 mb-2">
                    <div className="d-flex justify-content-between mb-2">
                      <div className="fw-semibold">{item.product_name}</div>
                      <div>
                        {formatPrice(item.total_price, selectedOrder.currency)}
                      </div>
                    </div>
                    <div className="d-flex justify-content-between text-muted">
                      <small>Quantity: {item.quantity}</small>
                      <small>
                        {formatPrice(item.unit_price, selectedOrder.currency)}{' '}
                        each
                      </small>
                    </div>
                    <div className="mt-2">{getStatusBadge(item.status)}</div>
                    {item.fulfillment_data?.tracking_number && (
                      <div className="mt-2 small">
                        <strong>Tracking:</strong>{' '}
                        {item.fulfillment_data.tracking_number}
                        {item.fulfillment_data.carrier && (
                          <span> ({item.fulfillment_data.carrier})</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Update Status */}
              <div className="mb-4">
                <h5>Update Status</h5>
                <Form.Select
                  onChange={(e) =>
                    handleUpdateStatus(selectedOrder.id, e.target.value)
                  }
                  disabled={updateStatusMutation.isPending}
                >
                  <option value="">Select new status...</option>
                  <option value={PhysicalItemStatus.PREPARING}>
                    Preparing
                  </option>
                  <option value={PhysicalItemStatus.READY_TO_SHIP}>
                    Ready to Ship
                  </option>
                  <option value={PhysicalItemStatus.SHIPPED}>Shipped</option>
                  <option value={PhysicalItemStatus.DELIVERED}>
                    Delivered
                  </option>
                  <option value={PhysicalItemStatus.CANCELLED}>
                    Cancelled
                  </option>
                </Form.Select>
              </div>

              {/* Add Tracking */}
              <div>
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={() => handleShowTracking(selectedOrder)}
                >
                  <i className="bi bi-truck me-2"></i>
                  Add Tracking Number
                </Button>
              </div>
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      {/* Tracking Number Modal */}
      <Modal
        show={showTrackingModal}
        onHide={() => setShowTrackingModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Tracking Number</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tracking Number *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Carrier (Optional)</Form.Label>
              <Form.Select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              >
                <option value="">Select carrier...</option>
                <option value="USPS">USPS</option>
                <option value="UPS">UPS</option>
                <option value="FedEx">FedEx</option>
                <option value="DHL">DHL</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowTrackingModal(false)}
            disabled={addTrackingMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddTracking}
            disabled={!trackingNumber || addTrackingMutation.isPending}
          >
            {addTrackingMutation.isPending ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Adding...
              </>
            ) : (
              'Add Tracking'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
