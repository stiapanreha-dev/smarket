/**
 * DateRangeFilter Component
 *
 * Filter component for selecting date ranges with presets
 */

import { useState } from 'react';
import { ButtonGroup, Button, Form } from 'react-bootstrap';
import { DatePicker } from '@/components/common/DatePicker';
import { useTranslation } from 'react-i18next';
import './DateRangeFilter.css';

export type DatePreset = 'today' | '7d' | '30d' | '90d' | 'custom';

interface DateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (start: Date | null, end: Date | null) => void;
  compareEnabled?: boolean;
  onCompareChange?: (enabled: boolean) => void;
}

export const DateRangeFilter = ({
  startDate,
  endDate,
  onDateChange,
  compareEnabled = false,
  onCompareChange,
}: DateRangeFilterProps) => {
  const { t } = useTranslation('merchant');
  const [activePreset, setActivePreset] = useState<DatePreset>('7d');

  const handlePresetClick = (preset: DatePreset) => {
    setActivePreset(preset);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let start = new Date();
    start.setHours(0, 0, 0, 0);

    switch (preset) {
      case 'today':
        onDateChange(start, today);
        break;
      case '7d':
        start.setDate(today.getDate() - 6);
        onDateChange(start, today);
        break;
      case '30d':
        start.setDate(today.getDate() - 29);
        onDateChange(start, today);
        break;
      case '90d':
        start.setDate(today.getDate() - 89);
        onDateChange(start, today);
        break;
      case 'custom':
        // Keep current dates
        break;
    }
  };

  const handleCustomDateChange = (type: 'start' | 'end', date: Date | null) => {
    setActivePreset('custom');
    if (type === 'start') {
      onDateChange(date, endDate);
    } else {
      onDateChange(startDate, date);
    }
  };

  return (
    <div className="date-range-filter d-flex flex-wrap align-items-center gap-3 mb-4">
      <ButtonGroup size="sm">
        <Button
          variant={activePreset === 'today' ? 'primary' : 'outline-primary'}
          onClick={() => handlePresetClick('today')}
        >
          {t('analytics.today', 'Today')}
        </Button>
        <Button
          variant={activePreset === '7d' ? 'primary' : 'outline-primary'}
          onClick={() => handlePresetClick('7d')}
        >
          {t('analytics.last7Days', '7 Days')}
        </Button>
        <Button
          variant={activePreset === '30d' ? 'primary' : 'outline-primary'}
          onClick={() => handlePresetClick('30d')}
        >
          {t('analytics.last30Days', '30 Days')}
        </Button>
        <Button
          variant={activePreset === '90d' ? 'primary' : 'outline-primary'}
          onClick={() => handlePresetClick('90d')}
        >
          {t('analytics.last90Days', '90 Days')}
        </Button>
      </ButtonGroup>

      <div className="d-flex align-items-center gap-2">
        <DatePicker
          selected={startDate}
          onChange={(date) => handleCustomDateChange('start', date)}
          placeholder={t('analytics.startDate', 'Start date')}
          maxDate={endDate || new Date()}
          containerClassName="date-picker-container"
        />
        <span className="text-muted">—</span>
        <DatePicker
          selected={endDate}
          onChange={(date) => handleCustomDateChange('end', date)}
          placeholder={t('analytics.endDate', 'End date')}
          minDate={startDate || undefined}
          maxDate={new Date()}
          containerClassName="date-picker-container"
        />
      </div>

      {onCompareChange && (
        <Form.Check
          type="checkbox"
          id="compare-periods"
          label={t('analytics.comparePrevious', 'Compare with previous period')}
          checked={compareEnabled}
          onChange={(e) => onCompareChange(e.target.checked)}
          className="ms-auto"
        />
      )}
    </div>
  );
};
