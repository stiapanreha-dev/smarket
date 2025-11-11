import { Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useCategories } from '@/hooks/useCatalog';
import './filters.css';

interface CategoryFilterProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}

/**
 * Category filter component
 */
export function CategoryFilter({ selectedCategories, onChange }: CategoryFilterProps) {
  const { t } = useTranslation();
  const { data: categories, isLoading } = useCategories();

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      onChange([...selectedCategories, categoryId]);
    }
  };

  if (isLoading) {
    return (
      <div className="filter-section mb-4">
        <h6 className="filter-title mb-3">{t('catalog.filters.categories')}</h6>
        <div className="text-muted small">{t('common.loading')}</div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="filter-section mb-4">
      <h6 className="filter-title mb-3">{t('catalog.filters.categories')}</h6>
      <div className="filter-options">
        {categories.map((category) => (
          <Form.Check
            key={category.id}
            type="checkbox"
            id={`category-${category.id}`}
            label={category.name}
            checked={selectedCategories.includes(category.id)}
            onChange={() => handleCategoryToggle(category.id)}
            className="mb-2"
          />
        ))}
      </div>
    </div>
  );
}
