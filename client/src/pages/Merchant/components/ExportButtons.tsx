/**
 * ExportButtons Component
 *
 * Buttons for exporting analytics data to CSV/PDF
 */

import { Button, ButtonGroup, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaFileCsv, FaFilePdf } from 'react-icons/fa';
import type { AnalyticsData } from '@/types/merchant';

interface ExportButtonsProps {
  data: AnalyticsData | undefined;
  isLoading?: boolean;
}

export const ExportButtons = ({ data, isLoading }: ExportButtonsProps) => {
  const { t } = useTranslation('merchant');

  const exportToCSV = () => {
    if (!data || !data.ordersDetail.length) return;

    // Create CSV header
    const headers = ['Date', 'Order Number', 'Customer', 'Total', 'Status'];
    const csvRows = [headers.join(',')];

    // Add data rows
    data.ordersDetail.forEach((order) => {
      const row = [
        order.date,
        order.orderNumber,
        `"${order.customer.replace(/"/g, '""')}"`, // Escape quotes
        order.total.toFixed(2),
        order.status,
      ];
      csvRows.push(row.join(','));
    });

    // Add summary
    csvRows.push('');
    csvRows.push(`Period: ${data.periodStart} to ${data.periodEnd}`);
    csvRows.push(`Total Revenue: $${data.kpi.revenue.value.toFixed(2)}`);
    csvRows.push(`Total Orders: ${data.kpi.orders.value}`);
    csvRows.push(`Avg Order Value: $${data.kpi.avgOrderValue.value.toFixed(2)}`);

    // Create and download file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analytics_${data.periodStart}_${data.periodEnd}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportToPDF = () => {
    if (!data) return;

    // For PDF, we'll use the browser's print functionality with a formatted view
    // In production, you would use jsPDF or similar library
    const content = `
      <html>
        <head>
          <title>Analytics Report ${data.periodStart} - ${data.periodEnd}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2c3e50; }
            .kpi { display: inline-block; margin: 10px 20px 10px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
            .kpi-value { font-size: 24px; font-weight: bold; color: #3498db; }
            .kpi-label { color: #6c757d; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #dee2e6; }
            th { background: #f8f9fa; }
          </style>
        </head>
        <body>
          <h1>Analytics Report</h1>
          <p>Period: ${data.periodStart} to ${data.periodEnd}</p>

          <div style="margin: 20px 0;">
            <div class="kpi">
              <div class="kpi-value">$${data.kpi.revenue.value.toFixed(0)}</div>
              <div class="kpi-label">Revenue</div>
            </div>
            <div class="kpi">
              <div class="kpi-value">${data.kpi.orders.value}</div>
              <div class="kpi-label">Orders</div>
            </div>
            <div class="kpi">
              <div class="kpi-value">$${data.kpi.avgOrderValue.value.toFixed(2)}</div>
              <div class="kpi-label">Avg Order Value</div>
            </div>
          </div>

          <h2>Orders</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.ordersDetail.map((order) => `
                <tr>
                  <td>${order.date}</td>
                  <td>${order.orderNumber}</td>
                  <td>${order.customer}</td>
                  <td>$${order.total.toFixed(2)}</td>
                  <td>${order.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const hasData = data && data.ordersDetail.length > 0;

  return (
    <ButtonGroup size="sm">
      <Button
        variant="outline-secondary"
        onClick={exportToCSV}
        disabled={isLoading || !hasData}
      >
        {isLoading ? (
          <Spinner animation="border" size="sm" className="me-1" />
        ) : (
          <FaFileCsv className="me-1" />
        )}
        {t('analytics.exportCSV', 'Export CSV')}
      </Button>
      <Button
        variant="outline-secondary"
        onClick={exportToPDF}
        disabled={isLoading || !hasData}
      >
        {isLoading ? (
          <Spinner animation="border" size="sm" className="me-1" />
        ) : (
          <FaFilePdf className="me-1" />
        )}
        {t('analytics.exportPDF', 'Export PDF')}
      </Button>
    </ButtonGroup>
  );
};
