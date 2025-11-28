/**
 * TopCategoriesChart Component
 *
 * Horizontal bar chart showing top categories by revenue
 */

import { Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TopCategory } from '@/types/merchant';

interface TopCategoriesChartProps {
  data: TopCategory[];
}

export const TopCategoriesChart = ({ data }: TopCategoriesChartProps) => {
  const { t } = useTranslation('merchant');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Take top 10 and sort by revenue
  const chartData = [...data]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map((item) => ({
      ...item,
      // Truncate long category names
      displayName: item.category.length > 20
        ? item.category.substring(0, 17) + '...'
        : item.category,
    }));

  if (data.length === 0) {
    return (
      <Card className="border-0 shadow-sm h-100">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="mb-0 fw-semibold">{t('analytics.topCategories', 'Top Categories')}</h5>
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
        <h5 className="mb-0 fw-semibold">{t('analytics.topCategories', 'Top Categories')}</h5>
      </Card.Header>
      <Card.Body>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              type="number"
              tickFormatter={formatCurrency}
              tick={{ fontSize: 11 }}
              stroke="#6c757d"
            />
            <YAxis
              type="category"
              dataKey="displayName"
              tick={{ fontSize: 11 }}
              stroke="#6c757d"
              width={100}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                return [value, 'Items Sold'];
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
              }}
              labelFormatter={(label) => {
                const item = chartData.find((d) => d.displayName === label);
                return item?.category || label;
              }}
            />
            <Bar
              dataKey="revenue"
              fill="#3498db"
              radius={[0, 4, 4, 0]}
              name="revenue"
            />
          </BarChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
};
