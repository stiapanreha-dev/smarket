/**
 * RevenueByProductTypeChart Component
 *
 * Pie/Donut chart showing revenue by product type (Physical, Digital, Service)
 */

import { Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { RevenueByProductType } from '@/types/merchant';

interface RevenueByProductTypeChartProps {
  data: RevenueByProductType[];
}

const COLORS = {
  PHYSICAL: '#3498db',
  SERVICE: '#2ecc71',
  COURSE: '#9b59b6',
  DIGITAL: '#e74c3c',
  UNKNOWN: '#95a5a6',
};

const TYPE_LABELS: Record<string, string> = {
  PHYSICAL: 'Physical',
  SERVICE: 'Service',
  COURSE: 'Course',
  DIGITAL: 'Digital',
  UNKNOWN: 'Other',
};

export const RevenueByProductTypeChart = ({ data }: RevenueByProductTypeChartProps) => {
  const { t } = useTranslation('merchant');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const chartData = data.map((item) => ({
    ...item,
    name: TYPE_LABELS[item.type] || item.type,
    color: COLORS[item.type as keyof typeof COLORS] || COLORS.UNKNOWN,
  }));

  const total = data.reduce((sum, item) => sum + item.revenue, 0);

  if (data.length === 0) {
    return (
      <Card className="border-0 shadow-sm h-100">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="mb-0 fw-semibold">{t('analytics.revenueByType', 'Revenue by Product Type')}</h5>
        </Card.Header>
        <Card.Body className="d-flex align-items-center justify-content-center">
          <p className="text-muted">{t('analytics.noData', 'No data available')}</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header className="bg-white border-0 py-3">
        <h5 className="mb-0 fw-semibold">{t('analytics.revenueByType', 'Revenue by Product Type')}</h5>
      </Card.Header>
      <Card.Body>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="revenue"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center mt-2">
          <span className="text-muted">Total: </span>
          <strong>{formatCurrency(total)}</strong>
        </div>
      </Card.Body>
    </Card>
  );
};
