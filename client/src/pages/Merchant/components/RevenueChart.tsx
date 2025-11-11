/**
 * RevenueChart Component
 *
 * Line chart displaying revenue for the last 7 days
 */

import { Card } from 'react-bootstrap';
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
import type { RevenueDataPoint } from '@/types';

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
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

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header className="bg-white border-0 py-3">
        <h5 className="mb-0 fw-semibold">Revenue (Last 7 Days)</h5>
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
              formatter={(value: number) => [formatCurrency(value), 'Revenue']}
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
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
};
