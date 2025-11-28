/**
 * KPICardsWithChange Component
 *
 * Displays KPI cards with percentage change indicators
 */

import { Card, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaDollarSign, FaShoppingCart, FaReceipt, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import type { KPIData } from '@/types/merchant';
import './KPICardsWithChange.css';

interface KPICardsWithChangeProps {
  data: KPIData;
  showChange?: boolean;
}

interface KPICardProps {
  title: string;
  value: string;
  icon: JSX.Element;
  color: string;
  change?: number;
  showChange: boolean;
}

const KPICard = ({ title, value, icon, color, change, showChange }: KPICardProps) => {
  const hasChange = showChange && typeof change === 'number' && !isNaN(change);
  const isPositive = hasChange && change >= 0;
  const changeColor = isPositive ? 'text-success' : 'text-danger';
  const ChangeIcon = isPositive ? FaArrowUp : FaArrowDown;

  return (
    <Card className="kpi-card border-0 shadow-sm h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <p className="kpi-title text-muted mb-2">{title}</p>
            <h3 className="kpi-value mb-1">{value}</h3>
            {hasChange && (
              <div className={`kpi-change ${changeColor}`}>
                <ChangeIcon size={12} className="me-1" />
                <span>{Math.abs(change).toFixed(1)}%</span>
                <span className="text-muted ms-1">vs prev period</span>
              </div>
            )}
          </div>
          <div className={`kpi-icon bg-${color}`}>{icon}</div>
        </div>
      </Card.Body>
    </Card>
  );
};

export const KPICardsWithChange = ({ data, showChange = false }: KPICardsWithChangeProps) => {
  const { t } = useTranslation('merchant');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Row className="g-3 mb-4">
      <Col xs={12} md={4}>
        <KPICard
          title={t('analytics.revenue', 'Revenue')}
          value={formatCurrency(data.revenue.value)}
          icon={<FaDollarSign />}
          color="primary"
          change={data.revenue.change}
          showChange={showChange}
        />
      </Col>
      <Col xs={12} md={4}>
        <KPICard
          title={t('analytics.orders', 'Orders')}
          value={data.orders.value.toString()}
          icon={<FaShoppingCart />}
          color="success"
          change={data.orders.change}
          showChange={showChange}
        />
      </Col>
      <Col xs={12} md={4}>
        <KPICard
          title={t('analytics.avgOrderValue', 'Avg Order Value')}
          value={formatCurrency(data.avgOrderValue.value)}
          icon={<FaReceipt />}
          color="info"
          change={data.avgOrderValue.change}
          showChange={showChange}
        />
      </Col>
    </Row>
  );
};
