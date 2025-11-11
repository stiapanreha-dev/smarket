import { Row, Col, Card, Placeholder } from 'react-bootstrap';

interface ProductsGridSkeletonProps {
  count?: number;
  viewMode?: 'grid' | 'list';
}

/**
 * Skeleton loader for products grid
 */
export function ProductsGridSkeleton({ count = 12, viewMode = 'grid' }: ProductsGridSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="products-list">
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="mb-3">
            <div className="row g-0">
              <div className="col-md-3">
                <Placeholder
                  as="div"
                  animation="glow"
                  style={{ height: '200px', background: '#e9ecef' }}
                />
              </div>
              <div className="col-md-9">
                <Card.Body>
                  <Placeholder as={Card.Title} animation="glow">
                    <Placeholder xs={8} />
                  </Placeholder>
                  <Placeholder as={Card.Text} animation="glow">
                    <Placeholder xs={12} />
                    <Placeholder xs={10} />
                  </Placeholder>
                  <Placeholder.Button xs={3} />
                </Card.Body>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Row className="products-grid g-4">
      {Array.from({ length: count }).map((_, index) => (
        <Col key={index} xs={12} sm={6} lg={4} xl={3}>
          <Card>
            <Placeholder
              as="div"
              animation="glow"
              style={{ height: '200px', background: '#e9ecef' }}
            />
            <Card.Body>
              <Placeholder as={Card.Title} animation="glow">
                <Placeholder xs={7} />
              </Placeholder>
              <Placeholder as={Card.Text} animation="glow">
                <Placeholder xs={4} />
              </Placeholder>
              <Placeholder.Button xs={12} />
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
