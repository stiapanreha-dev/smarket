/**
 * Orders Section Component
 *
 * Display user's order history with filtering and pagination
 */

import React, { useEffect, useState } from 'react';
import { Card, Button, Spinner, Alert, Form, Row, Col, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaShoppingBag, FaEye, FaFilter } from 'react-icons/fa';
import { getOrders } from '@/api/order.api';
import { formatAmount, formatDate } from '@/api/customer.api';
import type { Order, OrderFilters } from '@/types';

export const OrdersSection: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadOrders();
  }, [pagination.page, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: OrderFilters = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter) {
        filters.status = statusFilter as OrderFilters['status'];
      }

      const response = await getOrders(filters);

      // Handle both "meta" and "pagination" structures for compatibility
      const meta = (response as any).meta || (response as any).pagination;
      setOrders(response.data || []);
      setPagination((prev) => ({
        ...prev,
        total: meta?.total || 0,
        totalPages: meta?.totalPages || meta?.pages || Math.ceil((meta?.total || 0) / prev.limit),
      }));
    } catch (err) {
      setError(t('customer:orders.loadError'));
      console.error('Orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (['delivered', 'completed'].includes(statusLower)) return 'success';
    if (['shipped'].includes(statusLower)) return 'info';
    if (['confirmed', 'processing'].includes(statusLower)) return 'primary';
    if (['cancelled', 'failed'].includes(statusLower)) return 'danger';
    if (['refunded'].includes(statusLower)) return 'secondary';
    return 'warning';
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <>
      <div className="section-header">
        <h2>{t('customer:orders.title')}</h2>
        <div className="d-flex align-items-center gap-2">
          <FaFilter className="text-muted" />
          <Form.Select
            size="sm"
            value={statusFilter}
            onChange={handleFilterChange}
            style={{ width: 'auto' }}
          >
            <option value="">{t('customer:orders.allStatuses')}</option>
            <option value="pending">{t('orderStatus.pending')}</option>
            <option value="confirmed">{t('orderStatus.confirmed')}</option>
            <option value="processing">{t('orderStatus.processing')}</option>
            <option value="shipped">{t('orderStatus.shipped')}</option>
            <option value="delivered">{t('orderStatus.delivered')}</option>
            <option value="cancelled">{t('orderStatus.cancelled')}</option>
          </Form.Select>
        </div>
      </div>

      <div className="section-content">
        {loading ? (
          <div className="loading-spinner">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <FaShoppingBag className="empty-state-icon" />
            <h3>{t('customer:orders.noOrdersFound')}</h3>
            <p>
              {statusFilter
                ? t('customer:orders.noOrdersMatch')
                : t('customer:orders.noOrdersYet')}
            </p>
            <Link to="/catalog">
              <Button variant="primary">{t('customer:orders.startShopping')}</Button>
            </Link>
          </div>
        ) : (
          <>
            {orders.map((order) => (
              <Card key={order.id} className="mb-3">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col md={4}>
                      <h6 className="mb-1">{order.order_number}</h6>
                      <small className="text-muted">
                        {formatDate(order.created_at)}
                      </small>
                    </Col>
                    <Col md={2} className="text-center">
                      <Badge bg={getStatusBadgeVariant(order.status)}>
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                    </Col>
                    <Col md={2} className="text-center">
                      <small className="text-muted d-block">{t('customer:orders.itemsColumn')}</small>
                      <span>{order.line_items?.length || 0}</span>
                    </Col>
                    <Col md={2} className="text-end">
                      <strong>
                        {formatAmount(order.total_amount, order.currency)}
                      </strong>
                    </Col>
                    <Col md={2} className="text-end">
                      <Link to={`/orders/${order.order_number}`}>
                        <Button variant="outline-primary" size="sm">
                          <FaEye className="me-1" />
                          {t('customer:orders.view')}
                        </Button>
                      </Link>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4 gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  {t('customer:orders.previous')}
                </Button>
                <span className="d-flex align-items-center px-3">
                  {t('customer:orders.pageOf', { page: pagination.page, total: pagination.totalPages })}
                </span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  {t('customer:orders.next')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default OrdersSection;
