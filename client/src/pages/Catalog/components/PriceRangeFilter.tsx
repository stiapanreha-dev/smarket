import { useState, useEffect } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import './filters.css';

interface PriceRangeFilterProps {
  minPrice?: number;
  maxPrice?: number;
  onChange: (minPrice?: number, maxPrice?: number) => void;
  currency?: string;
}

/**
 * Price range filter component
 */
export function PriceRangeFilter({
  minPrice,
  maxPrice,
  onChange,
  currency = 'USD'
}: PriceRangeFilterProps) {
  const { t } = useTranslation();
  const [min, setMin] = useState(minPrice?.toString() || '');
  const [max, setMax] = useState(maxPrice?.toString() || '');

  useEffect(() => {
    setMin(minPrice?.toString() || '');
    setMax(maxPrice?.toString() || '');
  }, [minPrice, maxPrice]);

  const handleMinChange = (value: string) => {
    setMin(value);
    const minValue = value ? parseFloat(value) : undefined;
    const maxValue = max ? parseFloat(max) : undefined;
    if (minValue === undefined || !isNaN(minValue)) {
      onChange(minValue, maxValue);
    }
  };

  const handleMaxChange = (value: string) => {
    setMax(value);
    const minValue = min ? parseFloat(min) : undefined;
    const maxValue = value ? parseFloat(value) : undefined;
    if (maxValue === undefined || !isNaN(maxValue)) {
      onChange(minValue, maxValue);
    }
  };

  return (
    <div className="filter-section mb-4">
      <h6 className="filter-title mb-3">{t('catalog.filters.priceRange')}</h6>
      <Row className="g-2">
        <Col xs={6}>
          <Form.Control
            type="number"
            placeholder={t('catalog.filters.min')}
            value={min}
            onChange={(e) => handleMinChange(e.target.value)}
            min="0"
            step="0.01"
          />
        </Col>
        <Col xs={6}>
          <Form.Control
            type="number"
            placeholder={t('catalog.filters.max')}
            value={max}
            onChange={(e) => handleMaxChange(e.target.value)}
            min="0"
            step="0.01"
          />
        </Col>
      </Row>
      {(min || max) && (
        <small className="text-muted d-block mt-2">
          {min && max
            ? `${currency} ${min} - ${currency} ${max}`
            : min
            ? `${t('catalog.filters.from')} ${currency} ${min}`
            : `${t('catalog.filters.upTo')} ${currency} ${max}`}
        </small>
      )}
    </div>
  );
}
