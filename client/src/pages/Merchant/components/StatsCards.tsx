/**
 * StatsCards Component
 *
 * Displays key performance indicators (KPIs) for merchant dashboard
 */

import { Card, Row, Col } from 'react-bootstrap';
import { FaDollarSign, FaShoppingCart, FaBoxes, FaStar } from 'react-icons/fa';
import type { DashboardStats } from '@/types';
import './StatsCards.css';

interface StatsCardsProps {
  stats: DashboardStats;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: JSX.Element;
  color: string;
  subtitle?: string;
}

const StatCard = ({ title, value, icon, color, subtitle }: StatCardProps) => {
  return (
    <Card className="stat-card border-0 shadow-sm h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <p className="stat-title text-muted mb-2">{title}</p>
            <h3 className="stat-value mb-1">{value}</h3>
            {subtitle && <p className="stat-subtitle text-muted mb-0">{subtitle}</p>}
          </div>
          <div className={`stat-icon bg-${color}`}>{icon}</div>
        </div>
      </Card.Body>
    </Card>
  );
};

export const StatsCards = ({ stats }: StatsCardsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatRating = (rating: number | null) => {
    if (rating === null) return 'N/A';
    return rating.toFixed(1);
  };

  return (
    <Row className="g-3 mb-4">
      <Col xs={12} sm={6} xl={3}>
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.total_revenue)}
          icon={<FaDollarSign />}
          color="primary"
          subtitle="This month"
        />
      </Col>
      <Col xs={12} sm={6} xl={3}>
        <StatCard
          title="Total Orders"
          value={stats.total_orders}
          icon={<FaShoppingCart />}
          color="success"
          subtitle={`${stats.pending_orders} pending, ${stats.completed_orders} completed`}
        />
      </Col>
      <Col xs={12} sm={6} xl={3}>
        <StatCard
          title="Total Products"
          value={stats.total_products}
          icon={<FaBoxes />}
          color="warning"
          subtitle="Active listings"
        />
      </Col>
      <Col xs={12} sm={6} xl={3}>
        <StatCard
          title="Average Rating"
          value={formatRating(stats.average_rating)}
          icon={<FaStar />}
          color="info"
          subtitle="Customer feedback"
        />
      </Col>
    </Row>
  );
};
