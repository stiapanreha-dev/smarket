import { Card, Placeholder, Row, Col } from 'react-bootstrap';

interface SearchResultsSkeletonProps {
  viewMode?: 'grid' | 'list';
  count?: number;
}

/**
 * Loading skeleton for search results
 * Shows placeholder cards while search is in progress
 */
export function SearchResultsSkeleton({
  viewMode = 'grid',
  count = 12,
}: SearchResultsSkeletonProps) {
  return (
    <div className="search-results-skeleton">
      {/* Category Results Skeleton */}
      <section className="mb-5">
        <Placeholder as="h3" animation="glow" className="mb-3">
          <Placeholder xs={3} />
        </Placeholder>
        <Row className="g-3">
          {[1, 2, 3].map((i) => (
            <Col key={i} xs={12} sm={6} md={4}>
              <Card>
                <Card.Body>
                  <Placeholder as={Card.Title} animation="glow">
                    <Placeholder xs={6} />
                  </Placeholder>
                  <Placeholder as={Card.Text} animation="glow">
                    <Placeholder xs={8} />
                  </Placeholder>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* Products/Services Results Skeleton */}
      <section className="mb-5">
        <Placeholder as="h3" animation="glow" className="mb-3">
          <Placeholder xs={3} />
        </Placeholder>

        {viewMode === 'grid' ? (
          <Row className="g-4">
            {Array.from({ length: count }).map((_, index) => (
              <Col key={index} xs={12} sm={6} lg={4}>
                <Card>
                  <Placeholder
                    as="div"
                    animation="glow"
                    style={{ height: '200px', backgroundColor: '#e9ecef' }}
                  />
                  <Card.Body>
                    <Placeholder as={Card.Title} animation="glow">
                      <Placeholder xs={8} />
                    </Placeholder>
                    <Placeholder as={Card.Text} animation="glow">
                      <Placeholder xs={6} /> <Placeholder xs={4} />
                    </Placeholder>
                    <Placeholder.Button variant="primary" xs={6} />
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="d-flex flex-column gap-3">
            {Array.from({ length: count }).map((_, index) => (
              <Card key={index}>
                <Row className="g-0">
                  <Col md={3}>
                    <Placeholder
                      as="div"
                      animation="glow"
                      style={{ height: '150px', backgroundColor: '#e9ecef' }}
                    />
                  </Col>
                  <Col md={9}>
                    <Card.Body>
                      <Placeholder as={Card.Title} animation="glow">
                        <Placeholder xs={6} />
                      </Placeholder>
                      <Placeholder as={Card.Text} animation="glow">
                        <Placeholder xs={10} />
                        <Placeholder xs={8} />
                      </Placeholder>
                      <Placeholder.Button variant="primary" xs={4} />
                    </Card.Body>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default SearchResultsSkeleton;
