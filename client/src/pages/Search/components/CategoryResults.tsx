import { Card, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaFolder, FaArrowRight } from 'react-icons/fa';
import type { Category } from '@/types/catalog';

interface CategoryResultsProps {
  categories: Category[];
  maxDisplay?: number;
}

/**
 * Component to display category search results
 * Shows categories as clickable cards that link to filtered catalog
 */
export function CategoryResults({ categories, maxDisplay }: CategoryResultsProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const displayCategories = maxDisplay ? categories.slice(0, maxDisplay) : categories;

  if (displayCategories.length === 0) {
    return null;
  }

  return (
    <Row className="g-3">
      {displayCategories.map((category) => (
        <Col key={category.id} xs={12} sm={6} md={4}>
          <Link
            to={`/catalog?categories=${category.slug || category.id}`}
            className="text-decoration-none"
          >
            <Card className="h-100 category-result-card hover-shadow">
              <Card.Body className="d-flex align-items-center">
                <div className="category-icon me-3 text-primary">
                  <FaFolder size={32} />
                </div>
                <div className="flex-grow-1">
                  <Card.Title className="h6 mb-1">{category.name}</Card.Title>
                  {category.description && (
                    <Card.Text className="text-muted small mb-0">
                      {category.description.length > 60
                        ? `${category.description.substring(0, 60)}...`
                        : category.description}
                    </Card.Text>
                  )}
                </div>
                <FaArrowRight
                  className={`text-muted ${isRTL ? 'me-2' : 'ms-2'}`}
                  size={16}
                />
              </Card.Body>
            </Card>
          </Link>
        </Col>
      ))}
    </Row>
  );
}

export default CategoryResults;
