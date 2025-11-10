import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { Button, Badge } from '../../components/common';

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Container className="py-5">
      <Link to="/catalog" className="text-decoration-none mb-3 d-inline-block">
        &larr; Back to Catalog
      </Link>
      <Row>
        <Col md={6}>
          <div
            className="bg-light d-flex align-items-center justify-content-center"
            style={{ height: '400px' }}
          >
            <p className="text-muted">Product Image</p>
          </div>
        </Col>
        <Col md={6}>
          <h1 className="mb-3">Product {id}</h1>
          <Badge variant="success">In Stock</Badge>
          <h2 className="mt-3 mb-4">$99.99</h2>
          <p className="mb-4">
            This is a detailed description of the product. It includes all the
            important information about the product features, specifications,
            and benefits.
          </p>
          <div className="d-grid gap-2">
            <Button variant="primary" size="lg">
              Add to Cart
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetails;
