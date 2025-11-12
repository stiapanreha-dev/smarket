/**
 * Merchant Products Page
 *
 * Products management page for merchants with:
 * - Product filters (type, status, search)
 * - Products table with actions
 * - Bulk actions
 * - Pagination
 * - Delete confirmation modal
 *
 * Protected route - requires merchant role
 */

import { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  InputGroup,
  Table,
  Badge,
  Spinner,
  Alert,
  Modal,
  Pagination,
  Dropdown,
} from 'react-bootstrap';
import { MerchantSidebar } from './components';
import { useMerchantProducts, useDeleteProduct, useToggleProductStatus } from '@/hooks';
import { ProductType, ProductStatus } from '@/types/catalog';
import type { Product } from '@/types/catalog';
import './ProductsPage.css';

export const ProductsPage = () => {
  // Filters state
  const [productType, setProductType] = useState<ProductType | ''>('');
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Selected products for bulk actions
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Fetch products
  const { data, isLoading, error } = useMerchantProducts({
    type: productType || undefined,
    status: status || undefined,
    search: search || undefined,
    page,
    limit,
  });

  // Mutations
  const deleteProductMutation = useDeleteProduct();
  const toggleStatusMutation = useToggleProductStatus();

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleTypeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProductType(e.target.value as ProductType | '');
    setPage(1);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value as ProductStatus | '');
    setPage(1);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && data?.data) {
      setSelectedProducts(new Set(data.data.map((p) => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await deleteProductMutation.mutateAsync(productToDelete.id);
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleToggleStatus = async (productId: string) => {
    try {
      await toggleStatusMutation.mutateAsync(productId);
    } catch (err) {
      console.error('Failed to toggle product status:', err);
    }
  };

  const handleBulkActivate = async () => {
    // Bulk activation would need a separate endpoint
    // For now, we'll activate one by one
    for (const productId of selectedProducts) {
      try {
        await toggleStatusMutation.mutateAsync(productId);
      } catch (err) {
        console.error('Failed to toggle status:', err);
      }
    }
    setSelectedProducts(new Set());
  };

  // Utility functions
  const getStatusBadge = (status: ProductStatus) => {
    const variants: Record<ProductStatus, string> = {
      [ProductStatus.ACTIVE]: 'success',
      [ProductStatus.INACTIVE]: 'secondary',
      [ProductStatus.DRAFT]: 'warning',
      [ProductStatus.OUT_OF_STOCK]: 'danger',
      [ProductStatus.ARCHIVED]: 'dark',
      [ProductStatus.DELETED]: 'dark',
    };

    return <Badge bg={variants[status]}>{status}</Badge>;
  };

  const getTypeBadge = (type: ProductType) => {
    const variants: Record<ProductType, string> = {
      [ProductType.PHYSICAL]: 'primary',
      [ProductType.SERVICE]: 'info',
      [ProductType.COURSE]: 'warning',
    };

    return <Badge bg={variants[type]}>{type}</Badge>;
  };

  const formatPrice = (priceMinor: number | null, currency: string) => {
    if (priceMinor === null) return 'N/A';
    const price = priceMinor / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const getStockInfo = (product: Product) => {
    if (!product.variants || product.variants.length === 0) {
      return 'N/A';
    }
    const totalStock = product.variants.reduce(
      (sum, v) => sum + (v.inventory_quantity || 0),
      0
    );
    return totalStock;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="merchant-layout">
        <Container fluid>
          <Row>
            <Col md={2} className="p-0">
              <MerchantSidebar />
            </Col>
            <Col md={10}>
              <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: '80vh' }}
              >
                <div className="text-center">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Loading products...</p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="merchant-layout">
        <Container fluid>
          <Row>
            <Col md={2} className="p-0">
              <MerchantSidebar />
            </Col>
            <Col md={10}>
              <Container className="py-5">
                <Alert variant="danger">
                  <Alert.Heading>Error Loading Products</Alert.Heading>
                  <p className="mb-0">
                    {error instanceof Error
                      ? error.message
                      : 'Failed to load products. Please try again later.'}
                  </p>
                </Alert>
              </Container>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  const products = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="merchant-layout">
      <Container fluid>
        <Row>
          {/* Sidebar */}
          <Col md={2} className="p-0">
            <MerchantSidebar />
          </Col>

          {/* Main Content */}
          <Col md={10} className="products-content">
            <Container fluid className="py-4">
              {/* Page Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h2 className="fw-bold mb-0">My Products</h2>
                  <p className="text-muted mb-0">
                    Manage your product catalog
                  </p>
                </div>
                <Button variant="primary" href="/merchant/products/new">
                  Add New Product
                </Button>
              </div>

              {/* Filters */}
              <Row className="mb-4">
                <Col md={4}>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by name..."
                      value={search}
                      onChange={handleSearchChange}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select value={productType} onChange={handleTypeFilter}>
                    <option value="">All Types</option>
                    <option value={ProductType.PHYSICAL}>Physical</option>
                    <option value={ProductType.SERVICE}>Service</option>
                    <option value={ProductType.COURSE}>Digital</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select value={status} onChange={handleStatusFilter}>
                    <option value="">All Statuses</option>
                    <option value={ProductStatus.ACTIVE}>Active</option>
                    <option value={ProductStatus.INACTIVE}>Inactive</option>
                    <option value={ProductStatus.OUT_OF_STOCK}>
                      Out of Stock
                    </option>
                    <option value={ProductStatus.DRAFT}>Draft</option>
                  </Form.Select>
                </Col>
              </Row>

              {/* Bulk Actions */}
              {selectedProducts.size > 0 && (
                <div className="mb-3">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={handleBulkActivate}
                  >
                    Activate Selected ({selectedProducts.size})
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setSelectedProducts(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}

              {/* Products Table */}
              {products.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <i
                      className="bi bi-box-seam"
                      style={{ fontSize: '4rem', color: '#ccc' }}
                    ></i>
                  </div>
                  <h4>No products yet</h4>
                  <p className="text-muted">
                    Create your first product to get started
                  </p>
                  <Button variant="primary" href="/merchant/products/new">
                    Create Product
                  </Button>
                </div>
              ) : (
                <>
                  <Table responsive hover className="products-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>
                          <Form.Check
                            type="checkbox"
                            checked={
                              products.length > 0 &&
                              selectedProducts.size === products.length
                            }
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th style={{ width: '80px' }}>Image</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th style={{ width: '150px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <Form.Check
                              type="checkbox"
                              checked={selectedProducts.has(product.id)}
                              onChange={() => handleSelectProduct(product.id)}
                            />
                          </td>
                          <td>
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.title}
                                style={{
                                  width: '50px',
                                  height: '50px',
                                  objectFit: 'cover',
                                  borderRadius: '4px',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '50px',
                                  height: '50px',
                                  backgroundColor: '#f0f0f0',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <i className="bi bi-image text-muted"></i>
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="fw-semibold">{product.title}</div>
                            {product.description && (
                              <small className="text-muted">
                                {product.description.substring(0, 50)}
                                {product.description.length > 50 ? '...' : ''}
                              </small>
                            )}
                          </td>
                          <td>{getTypeBadge(product.type)}</td>
                          <td>
                            {formatPrice(
                              product.base_price_minor,
                              product.currency
                            )}
                          </td>
                          <td>{getStockInfo(product)}</td>
                          <td>{getStatusBadge(product.status)}</td>
                          <td>
                            <Dropdown>
                              <Dropdown.Toggle
                                variant="outline-secondary"
                                size="sm"
                                id={`dropdown-${product.id}`}
                              >
                                Actions
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item
                                  href={`/merchant/products/${product.id}/edit`}
                                >
                                  <i className="bi bi-pencil me-2"></i>
                                  Edit
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() => handleToggleStatus(product.id)}
                                  disabled={toggleStatusMutation.isPending}
                                >
                                  <i className="bi bi-toggle-on me-2"></i>
                                  {product.status === ProductStatus.ACTIVE
                                    ? 'Deactivate'
                                    : 'Activate'}
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                  onClick={() => handleDeleteClick(product)}
                                  className="text-danger"
                                >
                                  <i className="bi bi-trash me-2"></i>
                                  Delete
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {/* Pagination */}
                  {pagination && pagination.pages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div className="text-muted">
                        Showing {(page - 1) * limit + 1} to{' '}
                        {Math.min(page * limit, pagination.total)} of{' '}
                        {pagination.total} products
                      </div>
                      <Pagination>
                        <Pagination.First
                          onClick={() => setPage(1)}
                          disabled={page === 1}
                        />
                        <Pagination.Prev
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        />
                        {[...Array(pagination.pages)].map((_, idx) => {
                          const pageNum = idx + 1;
                          // Show first, last, current, and adjacent pages
                          if (
                            pageNum === 1 ||
                            pageNum === pagination.pages ||
                            (pageNum >= page - 1 && pageNum <= page + 1)
                          ) {
                            return (
                              <Pagination.Item
                                key={pageNum}
                                active={pageNum === page}
                                onClick={() => setPage(pageNum)}
                              >
                                {pageNum}
                              </Pagination.Item>
                            );
                          } else if (
                            pageNum === page - 2 ||
                            pageNum === page + 2
                          ) {
                            return <Pagination.Ellipsis key={pageNum} />;
                          }
                          return null;
                        })}
                        <Pagination.Next
                          onClick={() => setPage(page + 1)}
                          disabled={page === pagination.pages}
                        />
                        <Pagination.Last
                          onClick={() => setPage(pagination.pages)}
                          disabled={page === pagination.pages}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Container>
          </Col>
        </Row>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete{' '}
          <strong>{productToDelete?.title}</strong>? This action cannot be
          undone.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleteProductMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={deleteProductMutation.isPending}
          >
            {deleteProductMutation.isPending ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Deleting...
              </>
            ) : (
              'Delete Product'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
