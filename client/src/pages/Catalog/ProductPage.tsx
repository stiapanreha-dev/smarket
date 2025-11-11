import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Image,
  Button,
  Badge,
  Tabs,
  Tab,
  Form,
  Card,
  Breadcrumb,
  Placeholder,
} from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaShoppingCart,
  FaShippingFast,
  FaDownload,
  FaMapMarkerAlt,
  FaClock,
} from 'react-icons/fa';
import { useProduct, useRelatedProducts } from '@/hooks/useCatalog';
import {
  ProductType,
  formatPrice,
  getProductPrice,
  isPhysicalProduct,
  isServiceProduct,
  isCourseProduct,
  isProductInStock,
} from '@/types/catalog';
import { Navbar, Footer } from '@/components/layout';
import { ProductCard } from '@/components/features';
import './ProductPage.css';

/**
 * Product Detail Page Component
 * Features:
 * - Image gallery with thumbnails
 * - Product info with type-specific sections
 * - Tabs for description/specifications/reviews
 * - Related products carousel
 * - Breadcrumbs navigation
 * - Loading skeleton
 * - Multi-language support with RTL
 */
export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // State
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  // Fetch product data
  const { data: product, isLoading, error } = useProduct(id || '', {
    enabled: !!id,
  });

  // Fetch related products
  const { data: relatedProducts = [] } = useRelatedProducts(id || '', 5, {
    enabled: !!id && !!product,
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className={`product-page ${isRTL ? 'rtl' : ''}`}>
          <Container className="py-4">
            <ProductPageSkeleton />
          </Container>
        </div>
        <Footer />
      </>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <>
        <Navbar />
        <div className={`product-page ${isRTL ? 'rtl' : ''}`}>
          <Container className="py-4">
            <div className="alert alert-danger text-center">
              <h4>{t('catalog.error.loadFailed')}</h4>
              <Button variant="primary" onClick={() => navigate('/catalog')}>
                {t('nav.home')}
              </Button>
            </div>
          </Container>
        </div>
        <Footer />
      </>
    );
  }

  // Get product images
  const images = product.images || (product.image_url ? [product.image_url] : []);
  const hasImages = images.length > 0;

  // Get product price
  const price = getProductPrice(product);
  const formattedPrice = formatPrice(
    price,
    product.currency,
    i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'ru' ? 'ru-RU' : 'en-US'
  );

  // Check stock status
  const inStock = isProductInStock(product);

  // Get product type badge
  const getProductTypeBadge = () => {
    switch (product.type) {
      case ProductType.PHYSICAL:
        return { variant: 'primary', text: t('product.type.physical') };
      case ProductType.SERVICE:
        return { variant: 'success', text: t('product.type.service') };
      case ProductType.COURSE:
        return { variant: 'info', text: t('product.type.course') };
      default:
        return { variant: 'secondary', text: product.type };
    }
  };

  const typeBadge = getProductTypeBadge();

  // Render rating stars
  const renderRating = (rating: number | null) => {
    if (!rating) return null;

    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-warning" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-warning" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-warning" />);
      }
    }

    return (
      <div className="product-rating d-flex align-items-center gap-1">
        {stars}
        <span className="ms-2 text-muted">
          {rating.toFixed(1)} ({product.review_count || 0} {t('product.reviews')})
        </span>
      </div>
    );
  };

  // Handle quantity change
  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.max(1, Math.min(value, 99));
    setQuantity(newQuantity);
  };

  // Handle add to cart
  const handleAddToCart = () => {
    // TODO: Implement add to cart logic
    console.log('Add to cart:', product.id, 'quantity:', quantity);
  };

  // Handle buy now
  const handleBuyNow = () => {
    // TODO: Implement quick checkout logic
    console.log('Buy now:', product.id, 'quantity:', quantity);
  };

  // Handle book now (for services)
  const handleBookNow = () => {
    // TODO: Implement booking logic
    console.log('Book now:', product.id);
  };

  // Get specifications from product attrs or translation
  const specifications = product.translations?.[0]?.attrs?.specifications || {};
  const features = product.translations?.[0]?.attrs?.features || [];

  // Get variant attributes (for digital and service types)
  const variantAttrs = product.variants?.[0]?.attrs || {};

  return (
    <>
      <Navbar />
      <div className={`product-page ${isRTL ? 'rtl' : ''}`}>
        <Container className="py-4">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-4">
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
              {t('nav.home')}
            </Breadcrumb.Item>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/catalog' }}>
              {t('catalog.filters.title')}
            </Breadcrumb.Item>
            <Breadcrumb.Item active>{product.title}</Breadcrumb.Item>
          </Breadcrumb>

          {/* Main Product Section */}
          <Row className="mb-5">
            {/* Left Column - Image Gallery */}
            <Col lg={6} className="mb-4 mb-lg-0">
              <div className="product-image-gallery">
                {/* Main Image */}
                <div className="main-image-wrapper mb-3">
                  <Image
                    src={
                      hasImages
                        ? images[selectedImage]
                        : '/placeholder-product.svg'
                    }
                    alt={product.title}
                    className="main-image"
                    fluid
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        '/placeholder-product.svg';
                    }}
                  />
                </div>

                {/* Thumbnail Images */}
                {hasImages && images.length > 1 && (
                  <div className="thumbnails-wrapper d-flex gap-2 flex-wrap">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                        onClick={() => setSelectedImage(index)}
                      >
                        <Image
                          src={image}
                          alt={`${product.title} ${index + 1}`}
                          thumbnail
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              '/placeholder-product.svg';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Col>

            {/* Right Column - Product Info */}
            <Col lg={6}>
              <div className="product-info">
                {/* Product Type Badge */}
                <Badge bg={typeBadge.variant} className="mb-3">
                  {typeBadge.text}
                </Badge>

                {/* Product Title */}
                <h1 className="product-title mb-3">{product.title}</h1>

                {/* Rating */}
                <div className="mb-3">{renderRating(product.rating)}</div>

                {/* Price */}
                <h2 className="product-price mb-3">{formattedPrice}</h2>

                {/* Short Description */}
                {product.translations?.[0]?.attrs?.short_description && (
                  <p className="text-muted mb-4">
                    {product.translations[0].attrs.short_description}
                  </p>
                )}

                {/* Type-Specific Information */}
                {isPhysicalProduct(product) && (
                  <div className="product-stock-info mb-4">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FaShippingFast size={20} />
                      <span>
                        {inStock ? (
                          <Badge bg="success">{t('product.inStock')}</Badge>
                        ) : (
                          <Badge bg="danger">{t('product.outOfStock')}</Badge>
                        )}
                      </span>
                    </div>
                    {product.variants && product.variants[0] && (
                      <p className="text-muted small mb-0">
                        {t('product.sold', { count: product.sales_count || 0 })}
                      </p>
                    )}
                  </div>
                )}

                {isCourseProduct(product) && (
                  <div className="product-digital-info mb-4">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FaDownload size={20} />
                      <Badge bg="info">{t('product.instantDelivery')}</Badge>
                    </div>
                    {variantAttrs.file_size && (
                      <p className="text-muted small mb-1">
                        {t('product.fileSize')}: {variantAttrs.file_size}
                      </p>
                    )}
                    {variantAttrs.format && (
                      <p className="text-muted small mb-0">
                        {t('product.format')}: {variantAttrs.format}
                      </p>
                    )}
                  </div>
                )}

                {isServiceProduct(product) && (
                  <div className="product-service-info mb-4">
                    {variantAttrs.duration && (
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <FaClock size={20} />
                        <span>
                          {t('product.duration')}: {variantAttrs.duration}{' '}
                          {t('product.minutesShort')}
                        </span>
                      </div>
                    )}
                    {variantAttrs.location && (
                      <div className="d-flex align-items-center gap-2">
                        <FaMapMarkerAlt size={20} />
                        <span>
                          {t('product.location')}: {variantAttrs.location}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Seller Info */}
                <div className="seller-info mb-4">
                  <Card className="p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">{t('product.seller')}</h6>
                        <p className="text-muted mb-0 small">
                          {product.merchant_id}
                        </p>
                      </div>
                      {/* TODO: Add merchant rating */}
                    </div>
                  </Card>
                </div>

                {/* Quantity Selector (for physical and digital) */}
                {!isServiceProduct(product) && (
                  <div className="quantity-selector mb-4">
                    <Form.Label>{t('product.quantity')}</Form.Label>
                    <div className="d-flex align-items-center gap-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                      >
                        -
                      </Button>
                      <Form.Control
                        type="number"
                        min="1"
                        max="99"
                        value={quantity}
                        onChange={(e) =>
                          handleQuantityChange(parseInt(e.target.value) || 1)
                        }
                        className="text-center quantity-input"
                        style={{ width: '80px' }}
                      />
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= 99}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="action-buttons d-flex flex-column gap-3">
                  {isServiceProduct(product) ? (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-100"
                      onClick={handleBookNow}
                    >
                      {t('product.bookNow')}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-100"
                        onClick={handleAddToCart}
                        disabled={!inStock}
                      >
                        <FaShoppingCart className="me-2" />
                        {t('product.addToCart')}
                      </Button>
                      <Button
                        variant="success"
                        size="lg"
                        className="w-100"
                        onClick={handleBuyNow}
                        disabled={!inStock}
                      >
                        {t('product.buyNow')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Col>
          </Row>

          {/* Tabs Section */}
          <Row className="mb-5">
            <Col>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || 'description')}
                className="product-tabs mb-4"
              >
                {/* Description Tab */}
                <Tab eventKey="description" title={t('product.description')}>
                  <div className="tab-content-wrapper p-4">
                    {product.description ? (
                      <div
                        className="product-description"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    ) : (
                      <p className="text-muted">{t('product.description')}</p>
                    )}

                    {/* Features */}
                    {features.length > 0 && (
                      <div className="product-features mt-4">
                        <h5 className="mb-3">{t('product.features')}</h5>
                        <ul>
                          {features.map((feature: string, index: number) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Tab>

                {/* Specifications Tab */}
                {Object.keys(specifications).length > 0 && (
                  <Tab
                    eventKey="specifications"
                    title={t('product.specifications')}
                  >
                    <div className="tab-content-wrapper p-4">
                      <table className="table table-striped">
                        <tbody>
                          {Object.entries(specifications).map(([key, value]) => (
                            <tr key={key}>
                              <th style={{ width: '30%' }}>{key}</th>
                              <td>{String(value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Tab>
                )}

                {/* Reviews Tab (Placeholder) */}
                <Tab eventKey="reviews" title={t('product.reviews')}>
                  <div className="tab-content-wrapper p-4 text-center">
                    <p className="text-muted">{t('product.noReviews')}</p>
                    {/* TODO: Implement reviews section */}
                  </div>
                </Tab>
              </Tabs>
            </Col>
          </Row>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <Row>
              <Col>
                <h3 className="mb-4">{t('product.relatedProducts')}</h3>
                <Row xs={1} sm={2} md={3} lg={4} xl={5} className="g-4">
                  {relatedProducts.map((relatedProduct) => (
                    <Col key={relatedProduct.id}>
                      <ProductCard product={relatedProduct} variant="grid" />
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          )}
        </Container>
      </div>
      <Footer />
    </>
  );
}

/**
 * Loading skeleton for ProductPage
 */
function ProductPageSkeleton() {
  return (
    <>
      {/* Breadcrumbs skeleton */}
      <div className="mb-4">
        <Placeholder as="div" animation="glow">
          <Placeholder xs={6} />
        </Placeholder>
      </div>

      <Row className="mb-5">
        {/* Image skeleton */}
        <Col lg={6} className="mb-4 mb-lg-0">
          <Placeholder as="div" animation="glow">
            <Placeholder
              style={{ width: '100%', height: '400px' }}
              className="mb-3"
            />
            <div className="d-flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Placeholder
                  key={i}
                  style={{ width: '80px', height: '80px' }}
                />
              ))}
            </div>
          </Placeholder>
        </Col>

        {/* Info skeleton */}
        <Col lg={6}>
          <Placeholder as="div" animation="glow">
            <Placeholder xs={3} className="mb-3" />
            <Placeholder xs={8} size="lg" className="mb-3" />
            <Placeholder xs={6} className="mb-3" />
            <Placeholder xs={4} size="lg" className="mb-4" />
            <Placeholder xs={12} className="mb-2" />
            <Placeholder xs={10} className="mb-4" />
            <Placeholder xs={8} className="mb-3" />
            <div className="d-flex gap-2">
              <Placeholder.Button xs={6} size="lg" />
              <Placeholder.Button xs={6} size="lg" />
            </div>
          </Placeholder>
        </Col>
      </Row>

      {/* Tabs skeleton */}
      <Row>
        <Col>
          <Placeholder as="div" animation="glow">
            <div className="d-flex gap-3 mb-4">
              <Placeholder xs={2} />
              <Placeholder xs={2} />
              <Placeholder xs={2} />
            </div>
            <Placeholder xs={12} className="mb-2" />
            <Placeholder xs={11} className="mb-2" />
            <Placeholder xs={10} className="mb-2" />
            <Placeholder xs={12} className="mb-2" />
            <Placeholder xs={9} />
          </Placeholder>
        </Col>
      </Row>
    </>
  );
}

export default ProductPage;
