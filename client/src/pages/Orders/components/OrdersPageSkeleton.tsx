import { Card, Placeholder, Row, Col } from 'react-bootstrap';

/**
 * OrdersPageSkeleton Component
 *
 * Loading skeleton for the orders page
 * Displays placeholder cards while orders are being fetched
 */
export function OrdersPageSkeleton() {
  return (
    <div className="orders-page-skeleton">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="mb-3">
          <Card.Body>
            <Row>
              <Col xs={12} md={8}>
                <Placeholder as="div" animation="glow">
                  <Placeholder xs={6} className="mb-2" style={{ height: '24px' }} />
                  <Placeholder xs={4} className="mb-3" style={{ height: '16px' }} />

                  {/* Thumbnail placeholders */}
                  <div className="d-flex mb-2">
                    {[1, 2, 3].map((j) => (
                      <Placeholder
                        key={j}
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '8px',
                          marginRight: '8px',
                        }}
                      />
                    ))}
                  </div>

                  <Placeholder xs={3} style={{ height: '16px' }} />
                </Placeholder>
              </Col>
              <Col xs={12} md={4} className="text-end mt-3 mt-md-0">
                <Placeholder as="div" animation="glow">
                  <Placeholder xs={8} className="mb-2" style={{ height: '16px' }} />
                  <Placeholder xs={12} className="mb-3" style={{ height: '28px' }} />
                  <Placeholder.Button xs={12} variant="primary" />
                </Placeholder>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}

export default OrdersPageSkeleton;
