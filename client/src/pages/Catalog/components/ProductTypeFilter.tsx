import { Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { ProductType } from '@/types/catalog';
import './filters.css';

interface ProductTypeFilterProps {
  value?: ProductType;
  onChange: (value?: ProductType) => void;
}

/**
 * Product type filter component
 */
export function ProductTypeFilter({ value, onChange }: ProductTypeFilterProps) {
  const { t } = useTranslation();

  const productTypes = [
    { value: ProductType.PHYSICAL, label: t('product.type.physical') },
    { value: ProductType.SERVICE, label: t('product.type.service') },
    { value: ProductType.COURSE, label: t('product.type.course') },
  ];

  return (
    <div className="filter-section mb-4">
      <h6 className="filter-title mb-3">{t('catalog.filters.productType')}</h6>
      <div className="filter-options">
        <Form.Check
          type="radio"
          id="product-type-all"
          label={t('catalog.filters.all')}
          checked={!value}
          onChange={() => onChange(undefined)}
          className="mb-2"
        />
        {productTypes.map((type) => (
          <Form.Check
            key={type.value}
            type="radio"
            id={`product-type-${type.value}`}
            label={type.label}
            checked={value === type.value}
            onChange={() => onChange(type.value)}
            className="mb-2"
          />
        ))}
      </div>
    </div>
  );
}
