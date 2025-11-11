import { Card, Row, Col, Placeholder } from 'react-bootstrap';

/**
 * Cart Page Loading Skeleton
 *
 * Displays while cart data is loading
 */
export function CartPageSkeleton() {
  return (
    <>
      {/* Header Skeleton */}
      <div className="cart-header mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <Placeholder as="h1" animation="glow">
              <Placeholder xs={6} style={{ width: '200px', height: '32px' }} />
            </Placeholder>
            <Placeholder as="p" animation="glow" className="mt-2">
              <Placeholder xs={4} style={{ width: '100px' }} />
            </Placeholder>
          </div>
          <Placeholder.Button variant="outline-primary" xs={3} style={{ width: '180px' }} />
        </div>
      </div>

      <Row className="g-4">
        {/* Cart Items Skeleton */}
        <Col lg={8}>
          <div className="cart-items">
            {[1, 2, 3].map((index) => (
              <Card key={index} className="cart-item mb-3">
                <Card.Body>
                  <Row className="align-items-center g-3">
                    {/* Image Skeleton */}
                    <Col xs={12} sm={3} md={2}>
                      <Placeholder animation="glow">
                        <Placeholder
                          xs={12}
                          style={{ height: '100px', borderRadius: '8px' }}
                          bg="secondary"
                        />
                      </Placeholder>
                    </Col>

                    {/* Info Skeleton */}
                    <Col xs={12} sm={9} md={4}>
                      <Placeholder animation="glow">
                        <Placeholder xs={8} style={{ height: '20px' }} className="mb-2" />
                        <Placeholder xs={6} size="sm" className="mb-1" />
                        <Placeholder xs={5} size="sm" />
                      </Placeholder>
                    </Col>

                    {/* Price Skeleton */}
                    <Col xs={6} md={2} className="text-center">
                      <Placeholder animation="glow">
                        <Placeholder xs={6} size="sm" className="mb-1" />
                        <Placeholder xs={8} style={{ height: '20px' }} />
                      </Placeholder>
                    </Col>

                    {/* Quantity Skeleton */}
                    <Col xs={6} md={2}>
                      <Placeholder animation="glow">
                        <Placeholder xs={8} size="sm" className="mb-2" />
                        <Placeholder xs={12} style={{ height: '38px' }} />
                      </Placeholder>
                    </Col>

                    {/* Actions Skeleton */}
                    <Col xs={12} md={2} className="text-end">
                      <Placeholder animation="glow">
                        <Placeholder xs={8} style={{ height: '20px' }} className="mb-2" />
                        <Placeholder xs={10} style={{ height: '24px' }} className="mb-2" />
                        <Placeholder.Button variant="outline-danger" xs={12} size="sm" />
                      </Placeholder>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}
          </div>
        </Col>

        {/* Summary Skeleton */}
        <Col lg={4}>
          <Card className="cart-summary sticky-top">
            <Card.Body>
              <Placeholder animation="glow">
                <Placeholder xs={6} style={{ height: '24px' }} className="mb-3" />

                {/* Summary Items */}
                {[1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="d-flex justify-content-between align-items-center mb-3"
                  >
                    <Placeholder xs={4} />
                    <Placeholder xs={3} />
                  </div>
                ))}

                {/* Total */}
                <div className="d-flex justify-content-between align-items-center border-top pt-3 mb-3">
                  <Placeholder xs={3} style={{ height: '24px' }} />
                  <Placeholder xs={4} style={{ height: '24px' }} />
                </div>

                {/* Promo Code */}
                <Placeholder xs={12} style={{ height: '38px' }} className="mb-3" />

                {/* Checkout Button */}
                <Placeholder.Button variant="primary" xs={12} size="lg" className="mb-2" />

                {/* Security Note */}
                <Placeholder xs={6} size="sm" className="d-block mx-auto" />
              </Placeholder>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
