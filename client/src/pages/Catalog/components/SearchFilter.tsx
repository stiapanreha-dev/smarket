import { Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaSearch } from 'react-icons/fa';
import './filters.css';

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Search filter component for catalog
 */
export function SearchFilter({ value, onChange }: SearchFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="filter-section mb-4">
      <h6 className="filter-title mb-3">{t('catalog.filters.search')}</h6>
      <div className="position-relative">
        <FaSearch className="search-icon position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
        <Form.Control
          type="text"
          placeholder={t('catalog.filters.searchPlaceholder')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="ps-5"
        />
      </div>
    </div>
  );
}
