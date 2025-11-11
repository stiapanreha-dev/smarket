/**
 * RecentOrdersTable Component
 *
 * Table displaying the last 10 recent orders with quick actions
 */

import { Card, Table, Badge, Button, ButtonGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaEye, FaEdit } from 'react-icons/fa';
import { format } from 'date-fns';
import type { RecentOrderData } from '@/types';
import './RecentOrdersTable.css';

interface RecentOrdersTableProps {
  orders: RecentOrderData[];
}

const getStatusVariant = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: 'warning',
    PAYMENT_CONFIRMED: 'info',
    PREPARING: 'primary',
    READY_TO_SHIP: 'secondary',
    SHIPPED: 'info',
    DELIVERED: 'success',
    CANCELLED: 'danger',
    REFUNDED: 'dark',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
  };
  return statusMap[status] || 'secondary';
};

const formatStatus = (status: string): string => {
  return status.replace(/_/g, ' ');
};

export const RecentOrdersTable = ({ orders }: RecentOrdersTableProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'MMM dd, yyyy HH:mm');
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white border-0 py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-semibold">Recent Orders</h5>
          <Link to="/merchant/orders" className="btn btn-sm btn-outline-primary">
            View All
          </Link>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {orders.length > 0 ? (
          <div className="table-responsive">
            <Table hover className="mb-0 recent-orders-table">
              <thead className="bg-light">
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id}>
                    <td>
                      <Link
                        to={`/merchant/orders/${order.order_id}`}
                        className="text-decoration-none fw-semibold"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td>{order.customer_name}</td>
                    <td className="fw-semibold">{formatCurrency(order.total)}</td>
                    <td>
                      <Badge bg={getStatusVariant(order.status)} className="px-2 py-1">
                        {formatStatus(order.status)}
                      </Badge>
                    </td>
                    <td className="text-muted">{formatDate(order.created_at)}</td>
                    <td>
                      <ButtonGroup size="sm" className="d-flex justify-content-center">
                        <Button
                          as={Link}
                          to={`/merchant/orders/${order.order_id}`}
                          variant="outline-primary"
                          title="View Order"
                        >
                          <FaEye />
                        </Button>
                        <Button
                          as={Link}
                          to={`/merchant/orders/${order.order_id}/edit`}
                          variant="outline-secondary"
                          title="Update Status"
                        >
                          <FaEdit />
                        </Button>
                      </ButtonGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <div className="p-5 text-center">
            <p className="text-muted mb-0">No recent orders found</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
