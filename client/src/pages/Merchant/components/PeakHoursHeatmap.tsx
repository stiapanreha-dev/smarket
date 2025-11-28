/**
 * PeakHoursHeatmap Component
 *
 * Heatmap showing orders by hour of day and day of week
 */

import { Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import type { OrdersByHour } from '@/types/merchant';
import './PeakHoursHeatmap.css';

interface PeakHoursHeatmapProps {
  data: OrdersByHour[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const PeakHoursHeatmap = ({ data }: PeakHoursHeatmapProps) => {
  const { t } = useTranslation('merchant');

  // Build a map for quick lookup
  const dataMap = new Map<string, number>();
  let maxCount = 0;

  data.forEach((item) => {
    const key = `${item.dayOfWeek}-${item.hour}`;
    dataMap.set(key, item.count);
    if (item.count > maxCount) maxCount = item.count;
  });

  const getColor = (count: number): string => {
    if (count === 0 || maxCount === 0) return '#f0f0f0';
    const intensity = count / maxCount;
    // Gradient from light blue to dark blue
    if (intensity < 0.25) return '#cce5ff';
    if (intensity < 0.5) return '#99caff';
    if (intensity < 0.75) return '#4da3ff';
    return '#0066cc';
  };

  if (data.length === 0) {
    return (
      <Card className="border-0 shadow-sm h-100">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="mb-0 fw-semibold">{t('analytics.peakHours', 'Peak Hours')}</h5>
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
        <h5 className="mb-0 fw-semibold">{t('analytics.peakHours', 'Peak Hours')}</h5>
      </Card.Header>
      <Card.Body>
        <div className="heatmap-container">
          {/* Hour labels */}
          <div className="heatmap-row hour-labels">
            <div className="heatmap-day-label"></div>
            {HOURS.filter((h) => h % 3 === 0).map((hour) => (
              <div key={hour} className="heatmap-hour-label" style={{ gridColumn: `span 3` }}>
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="heatmap-row">
              <div className="heatmap-day-label">{day}</div>
              {HOURS.map((hour) => {
                const count = dataMap.get(`${dayIndex}-${hour}`) || 0;
                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className="heatmap-cell"
                    style={{ backgroundColor: getColor(count) }}
                    title={`${day} ${hour}:00 - ${count} orders`}
                  />
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="heatmap-legend mt-3">
            <span className="text-muted me-2">Less</span>
            <div className="legend-item" style={{ backgroundColor: '#f0f0f0' }} />
            <div className="legend-item" style={{ backgroundColor: '#cce5ff' }} />
            <div className="legend-item" style={{ backgroundColor: '#99caff' }} />
            <div className="legend-item" style={{ backgroundColor: '#4da3ff' }} />
            <div className="legend-item" style={{ backgroundColor: '#0066cc' }} />
            <span className="text-muted ms-2">More</span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
