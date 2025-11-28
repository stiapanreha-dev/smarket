/**
 * Payments Section Component
 *
 * Display user's payment history with pagination
 */

import React, { useEffect, useState } from 'react';
import { Card, Button, Spinner, Alert, Badge, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCreditCard, FaReceipt, FaUndo } from 'react-icons/fa';
import { getMyPayments, formatAmount, formatDate } from '@/api/customer.api';
import type { PaymentItem, UserPaymentsResponse } from '@/api/customer.api';

export const PaymentsSection: React.FC = () => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadPayments();
  }, [pagination.page]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: UserPaymentsResponse = await getMyPayments({
        page: pagination.page,
        limit: pagination.limit,
      });

      setPayments(response.payments);
      setPagination((prev) => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages,
      }));
    } catch (err) {
      setError(t('customer:payments.loadError'));
      console.error('Payments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (['captured', 'completed', 'succeeded'].includes(statusLower)) return 'success';
    if (['authorized'].includes(statusLower)) return 'info';
    if (['pending', 'requires_action'].includes(statusLower)) return 'warning';
    if (['failed', 'cancelled'].includes(statusLower)) return 'danger';
    if (['refunded', 'partially_refunded'].includes(statusLower)) return 'secondary';
    return 'secondary';
  };

  const getProviderLabel = (provider: string): string => {
    const providers: Record<string, string> = {
      stripe: 'Stripe',
      yookassa: 'YooKassa',
      network_intl: 'Network Intl',
    };
    return providers[provider.toLowerCase()] || provider;
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <>
      <div className="section-header">
        <h2>{t('customer:payments.title')}</h2>
      </div>

      <div className="section-content">
        {loading ? (
          <div className="loading-spinner">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <FaCreditCard className="empty-state-icon" />
            <h3>{t('customer:payments.noPaymentsYet')}</h3>
            <p>{t('customer:payments.paymentHint')}</p>
            <Link to="/catalog">
              <Button variant="primary">{t('customer:common.startShopping')}</Button>
            </Link>
          </div>
        ) : (
          <>
            {payments.map((payment) => (
              <Card key={payment.id} className="mb-3">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col md={3}>
                      <div className="d-flex align-items-center">
                        <div
                          className="me-3 d-flex align-items-center justify-content-center rounded"
                          style={{
                            width: 40,
                            height: 40,
                            backgroundColor: 'var(--bg-light)',
                            color: 'var(--main-color)',
                          }}
                        >
                          <FaReceipt />
                        </div>
                        <div>
                          <strong>
                            {formatAmount(payment.amount, payment.currency)}
                          </strong>
                          <div className="small text-muted">
                            {getProviderLabel(payment.provider)}
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col md={2} className="text-center">
                      <Badge bg={getStatusBadgeVariant(payment.status)}>
                        {payment.status.replace(/_/g, ' ')}
                      </Badge>
                    </Col>
                    <Col md={3}>
                      {payment.orderNumber ? (
                        <Link
                          to={`/orders/${payment.orderNumber}`}
                          className="text-decoration-none"
                        >
                          {t('customer:payments.order')}: {payment.orderNumber}
                        </Link>
                      ) : (
                        <span className="text-muted">{t('customer:payments.noOrderLinked')}</span>
                      )}
                    </Col>
                    <Col md={2} className="text-muted small">
                      {formatDate(payment.createdAt)}
                    </Col>
                    <Col md={2} className="text-end">
                      {payment.refundedAmount > 0 && (
                        <div className="text-danger small">
                          <FaUndo className="me-1" />
                          {formatAmount(payment.refundedAmount, payment.currency)} {t('customer:payments.refunded')}
                        </div>
                      )}
                    </Col>
                  </Row>

                  {/* Refunds List */}
                  {payment.refunds && payment.refunds.length > 0 && (
                    <div className="mt-3 pt-3 border-top">
                      <small className="text-muted d-block mb-2">{t('customer:payments.refunds')}:</small>
                      {payment.refunds.map((refund) => (
                        <div
                          key={refund.id}
                          className="d-flex justify-content-between align-items-center py-1 px-2 bg-light rounded mb-1"
                        >
                          <span>
                            {formatAmount(refund.amount, refund.currency)} - {refund.reason}
                          </span>
                          <Badge bg={getStatusBadgeVariant(refund.status)} size="sm">
                            {refund.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
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
                  {t('customer:common.previous')}
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
                  {t('customer:common.next')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default PaymentsSection;
