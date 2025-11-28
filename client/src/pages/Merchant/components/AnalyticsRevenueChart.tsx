/**
 * AnalyticsRevenueChart Component
 *
 * Line chart with support for comparing current vs previous period
 */

import { Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { RevenueByDay } from '@/types/merchant';

interface AnalyticsRevenueChartProps {
  data: RevenueByDay[];
  showComparison?: boolean;
}

export const AnalyticsRevenueChart = ({
  data,
  showComparison = false,
}: AnalyticsRevenueChartProps) => {
  const { t } = useTranslation('merchant');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(0)}`;
  };

  const chartData = data.map((item) => ({
    ...item,
    formattedDate: formatDate(item.date),
  }));

  const hasPreviousData = showComparison && data.some((d) => d.previousRevenue !== undefined);

  if (data.length === 0) {
    return (
      <Card className="border-0 shadow-sm h-100">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="mb-0 fw-semibold">{t('analytics.revenueOverTime', 'Revenue Over Time')}</h5>
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
        <h5 className="mb-0 fw-semibold">{t('analytics.revenueOverTime', 'Revenue Over Time')}</h5>
      </Card.Header>
      <Card.Body>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 12 }}
              stroke="#6c757d"
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
              stroke="#6c757d"
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                const label = name === 'revenue'
                  ? t('analytics.currentPeriod', 'Current Period')
                  : t('analytics.previousPeriod', 'Previous Period');
                return [formatCurrency(value), label];
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3498db"
              strokeWidth={2}
              dot={{ fill: '#3498db', r: 4 }}
              activeDot={{ r: 6 }}
              name={hasPreviousData ? t('analytics.currentPeriod', 'Current Period') : 'Revenue'}
            />
            {hasPreviousData && (
              <Line
                type="monotone"
                dataKey="previousRevenue"
                stroke="#95a5a6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#95a5a6', r: 3 }}
                name={t('analytics.previousPeriod', 'Previous Period')}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
};
