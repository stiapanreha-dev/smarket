/**
 * OrdersByStatusChart Component
 *
 * Pie chart displaying orders grouped by status
 */

import { Card } from 'react-bootstrap';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { OrdersByStatusData } from '@/types';

interface OrdersByStatusChartProps {
  data: OrdersByStatusData[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f39c12',
  PAYMENT_CONFIRMED: '#3498db',
  PREPARING: '#9b59b6',
  READY_TO_SHIP: '#1abc9c',
  SHIPPED: '#16a085',
  DELIVERED: '#2ecc71',
  CANCELLED: '#e74c3c',
  REFUNDED: '#e67e22',
  IN_PROGRESS: '#3498db',
  COMPLETED: '#2ecc71',
};

export const OrdersByStatusChart = ({ data }: OrdersByStatusChartProps) => {
  const chartData = data.map((item) => ({
    name: item.status.replace(/_/g, ' '),
    value: item.count,
    status: item.status,
  }));

  const COLORS = chartData.map(
    (item) => STATUS_COLORS[item.status] || '#95a5a6'
  );

  const renderCustomLabel = (entry: any) => {
    return `${entry.name}: ${entry.value}`;
  };

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header className="bg-white border-0 py-3">
        <h5 className="mb-0 fw-semibold">Orders by Status</h5>
      </Card.Header>
      <Card.Body>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) =>
                  `${value} (${entry.payload.value})`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="d-flex align-items-center justify-content-center h-100">
            <p className="text-muted">No orders data available</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
