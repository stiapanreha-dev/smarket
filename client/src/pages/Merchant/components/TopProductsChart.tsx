/**
 * TopProductsChart Component
 *
 * Bar chart displaying top 5 selling products
 */

import { Card } from 'react-bootstrap';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TopProductData } from '@/types';

interface TopProductsChartProps {
  data: TopProductData[];
}

export const TopProductsChart = ({ data }: TopProductsChartProps) => {
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(0)}`;
  };

  const truncateName = (name: string, maxLength = 20) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  const chartData = data.map((item) => ({
    ...item,
    shortName: truncateName(item.product_name),
  }));

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header className="bg-white border-0 py-3">
        <h5 className="mb-0 fw-semibold">Top Selling Products</h5>
      </Card.Header>
      <Card.Body>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 12 }}
                stroke="#6c757d"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
                stroke="#6c757d"
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'total_revenue') {
                    return [formatCurrency(value), 'Revenue'];
                  }
                  return [value, 'Units Sold'];
                }}
                labelFormatter={(label: string) => {
                  const item = data.find(
                    (d) => truncateName(d.product_name) === label
                  );
                  return item ? item.product_name : label;
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar
                dataKey="total_revenue"
                fill="#3498db"
                name="Revenue"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="total_sold"
                fill="#2ecc71"
                name="Units Sold"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="d-flex align-items-center justify-content-center h-100">
            <p className="text-muted">No products data available</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
