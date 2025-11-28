/**
 * Dashboard Overview Component
 *
 * Main dashboard view with statistics widgets and recent orders
 */

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaShoppingBag,
  FaMoneyBillWave,
  FaClock,
  FaExclamationCircle,
  FaStore,
  FaHeart,
} from 'react-icons/fa';
import { getDashboardStats, formatAmount, formatDate } from '@/api/customer.api';
import type { DashboardStats, RecentOrder } from '@/api/customer.api';
import type { CustomerSection } from '../CustomerDashboardPage';

interface DashboardOverviewProps {
  onNavigate: (section: CustomerSection) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(t('customer:overview.loadError'));
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (['delivered', 'completed'].includes(statusLower)) return 'delivered';
    if (['shipped'].includes(statusLower)) return 'shipped';
    if (['confirmed', 'processing'].includes(statusLower)) return 'processing';
    if (['cancelled', 'failed'].includes(statusLower)) return 'cancelled';
    if (['refunded'].includes(statusLower)) return 'refunded';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-content">
        <Alert variant="danger">{error}</Alert>
        <Button variant="outline-primary" onClick={loadStats}>
          {t('customer:overview.tryAgain')}
        </Button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="section-content">
      {/* Statistics Widgets */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <div className="stat-widget">
            <div className="stat-widget-icon">
              <FaShoppingBag />
            </div>
            <div className="stat-widget-value">{stats.totalOrders}</div>
            <div className="stat-widget-label">{t('customer:overview.totalOrders')}</div>
          </div>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <div className="stat-widget">
            <div className="stat-widget-icon">
              <FaMoneyBillWave />
            </div>
            <div className="stat-widget-value">
              {formatAmount(stats.totalSpent, stats.currency)}
            </div>
            <div className="stat-widget-label">{t('customer:overview.totalSpent')}</div>
          </div>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <div className="stat-widget">
            <div className="stat-widget-icon">
              <FaClock />
            </div>
            <div className="stat-widget-value">{stats.activeOrders}</div>
            <div className="stat-widget-label">{t('customer:overview.activeOrders')}</div>
          </div>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <div className="stat-widget">
            <div className="stat-widget-icon">
              <FaExclamationCircle />
            </div>
            <div className="stat-widget-value">{stats.pendingActions}</div>
            <div className="stat-widget-label">{t('customer:overview.pendingActions')}</div>
          </div>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Card className="recent-orders-card mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5>{t('customer:overview.recentOrders')}</h5>
          <Button
            variant="link"
            className="p-0 text-decoration-none"
            onClick={() => onNavigate('orders')}
          >
            {t('customer:overview.viewAll')}
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          {stats.recentOrders.length > 0 ? (
            <ul className="recent-orders-list">
              {stats.recentOrders.map((order: RecentOrder) => (
                <li key={order.id}>
                  <div className="order-row">
                    <div className="order-info">
                      <div className="order-number">{order.order_number}</div>
                      <div className="order-date">{formatDate(order.created_at)}</div>
                    </div>
                    <div className="text-center">
                      <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div>
                      <div className="order-amount">
                        {formatAmount(order.total_amount, order.currency)}
                      </div>
                      <div className="order-items-count">
                        {order.items_count} {order.items_count === 1 ? t('customer:overview.item') : t('customer:overview.items')}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <FaShoppingBag className="empty-state-icon" />
              <h3>{t('customer:overview.noOrdersYet')}</h3>
              <p>{t('customer:overview.startShoppingHint')}</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/catalog" className="quick-action-btn">
          <FaStore />
          <span>{t('customer:overview.browseCatalog')}</span>
        </Link>
        <button
          className="quick-action-btn"
          onClick={() => onNavigate('wishlist')}
        >
          <FaHeart />
          <span>{t('customer:overview.myWishlist')}</span>
        </button>
        <button
          className="quick-action-btn"
          onClick={() => onNavigate('payments')}
        >
          <FaMoneyBillWave />
          <span>{t('customer:overview.paymentHistory')}</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardOverview;
