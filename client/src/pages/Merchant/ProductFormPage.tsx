/**
 * Product Form Page
 *
 * Create/Edit product page with multi-step form:
 * - Basic Information (name, description, category, type, tags)
 * - Images (upload, reorder, set primary)
 * - Pricing & Inventory
 * - Shipping (for physical products)
 * - SEO (meta title, description, slug)
 *
 * Uses:
 * - React Hook Form for form management
 * - EditorJS for rich text description
 * - React Dropzone for image uploads
 *
 * Protected route - requires merchant role
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Tabs,
  Tab,
  Spinner,
  Alert,
  Badge,
} from 'react-bootstrap';
import { MerchantSidebar } from './components';
import {
  useMerchantProduct,
  useCreateProduct,
  useUpdateProduct,
  useUploadProductImage,
} from '@/hooks';
import { ProductType, ProductStatus } from '@/types/catalog';
import type { CreateProductDto } from '@/api/merchant.api';
import { BasicInformationTab } from './components/ProductForm/BasicInformationTab';
import { ImagesTab } from './components/ProductForm/ImagesTab';
import { PricingInventoryTab } from './components/ProductForm/PricingInventoryTab';
import { SEOTab } from './components/ProductForm/SEOTab';
import './ProductFormPage.css';

// ============================================================================
// Form Schema & Types
// ============================================================================

const productSchema = yup.object().shape({
  // Basic Information
  title: yup.string().required('Product name is required').min(3, 'Min 3 characters'),
  description: yup.string(),
  type: yup.mixed<ProductType>().oneOf(Object.values(ProductType)).required('Product type is required'),
  status: yup.mixed<ProductStatus>().oneOf(Object.values(ProductStatus)),
  category: yup.array().of(yup.string()),
  tags: yup.array().of(yup.string()),

  // Images
  images: yup.array().of(yup.string()).max(10, 'Maximum 10 images allowed'),
  image_url: yup.string(),

  // Pricing & Inventory
  base_price_minor: yup.number().min(0, 'Price must be positive'),
  currency: yup.string().default('USD'),
  compare_at_price_minor: yup.number().min(0).nullable(),
  cost_per_item: yup.number().min(0).nullable(),
  sku: yup.string(),
  barcode: yup.string(),
  inventory_quantity: yup.number().min(0).integer(),

  // Digital Product Fields
  file_url: yup.string().when('type', {
    is: ProductType.COURSE,
    then: (schema) => schema.required('Digital file is required for digital products'),
    otherwise: (schema) => schema,
  }),
  file_size: yup.number().min(0),
  file_format: yup.string(),
  download_limit: yup.number().min(-1).integer(), // -1 = unlimited

  // Service Fields
  duration: yup.number().min(0).integer(), // in minutes
  location: yup.string(),
  capacity: yup.number().min(0).integer().transform((value, originalValue) =>
    originalValue === '' || originalValue === null ? 0 : value
  ),

  // Shipping (Physical)
  weight: yup.number().min(0),
  requires_shipping: yup.boolean(),

  // SEO
  meta_title: yup.string().max(60, 'Max 60 characters'),
  meta_description: yup.string().max(160, 'Max 160 characters'),
  slug: yup.string()
    .transform((value) => value === '' ? undefined : value)
    .matches(/^[a-z0-9-]*$/, 'Only lowercase letters, numbers, and hyphens'),
});

export type ProductFormData = yup.InferType<typeof productSchema>;

// ============================================================================
// Main Component
// ============================================================================

export const ProductFormPage = () => {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!productId && productId !== 'new';

  // State
  const [activeTab, setActiveTab] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);

  // Hooks
  const { data: product, isLoading: isLoadingProduct } = useMerchantProduct(
    isEditMode ? productId : undefined
  );
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  // Form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProductFormData>({
    resolver: yupResolver(productSchema),
    defaultValues: {
      title: '',
      description: '',
      type: ProductType.PHYSICAL,
      status: ProductStatus.DRAFT,
      category: [],
      tags: [],
      images: [],
      image_url: '',
      base_price_minor: 0,
      currency: 'USD',
      meta_title: '',
      meta_description: '',
      slug: '',
      sku: '',
      compare_at_price_minor: 0,
      inventory_quantity: 0,
      barcode: '',
      weight: 0,
      cost_per_item: 0,
      requires_shipping: true,
      // Digital product fields
      file_url: '',
      file_size: 0,
      file_format: '',
      download_limit: -1,
      // Service fields
      duration: 0,
      location: '',
      capacity: 0,
    },
  });

  const productType = watch('type');

  // Load product data in edit mode
  useEffect(() => {
    if (product && isEditMode) {
      reset({
        title: product.title,
        description: product.description || '',
        type: product.type,
        status: product.status,
        category: product.attrs?.category || [],
        tags: product.attrs?.tags || [],
        images: product.images || [],
        image_url: product.image_url || '',
        base_price_minor: product.base_price_minor || 0,
        currency: product.currency,
        meta_title: product.seo?.meta_title || '',
        meta_description: product.seo?.meta_description || '',
        slug: product.slug || '',
        // Load variant data if exists
        ...(product.variants && product.variants.length > 0
          ? {
              sku: product.variants[0].sku || '',
              compare_at_price_minor: product.variants[0].compare_at_price_minor || 0,
              inventory_quantity: product.variants[0].inventory_quantity || 0,
              barcode: product.variants[0].barcode || '',
              weight: product.variants[0].weight || 0,
              cost_per_item: product.variants[0].attrs?.cost_per_item || 0,
              requires_shipping: product.variants[0].requires_shipping ?? true,
              // Digital fields
              file_url: product.variants[0].attrs?.file_url || '',
              file_size: product.variants[0].attrs?.file_size || 0,
              file_format: product.variants[0].attrs?.file_format || '',
              download_limit: product.variants[0].attrs?.download_limit ?? -1,
              // Service fields
              duration: product.variants[0].attrs?.duration || 0,
              location: product.variants[0].attrs?.location || '',
              capacity: product.variants[0].attrs?.capacity || 0,
            }
          : {
              sku: '',
              compare_at_price_minor: 0,
              inventory_quantity: 0,
              barcode: '',
              weight: 0,
              cost_per_item: 0,
              requires_shipping: true,
              file_url: '',
              file_size: 0,
              file_format: '',
              download_limit: -1,
              duration: 0,
              location: '',
              capacity: 0,
            }),
      });
    }
  }, [product, isEditMode, reset]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const onSubmit = async (data: ProductFormData, publishImmediately = false) => {
    try {
      setIsSaving(true);

      // Prepare DTO
      const dto: CreateProductDto = {
        title: data.title,
        description: data.description,
        type: data.type,
        status: publishImmediately ? ProductStatus.ACTIVE : data.status,
        attrs: {
          category: data.category,
          tags: data.tags,
        },
        images: data.images,
        image_url: data.image_url,
        base_price_minor: data.base_price_minor,
        currency: data.currency,
        seo: {
          meta_title: data.meta_title,
          meta_description: data.meta_description,
        },
        slug: data.slug,
        variants: [
          {
            sku: data.sku || `SKU-${Date.now()}`,
            title: data.title,
            price_minor: data.base_price_minor || 0,
            currency: data.currency || 'USD',
            compare_at_price_minor: data.compare_at_price_minor,
            inventory_quantity: data.inventory_quantity || 0,
            attrs: {
              weight: data.weight,
              barcode: data.barcode,
              cost_per_item: data.cost_per_item,
              // Digital
              file_url: data.file_url,
              file_size: data.file_size,
              file_format: data.file_format,
              download_limit: data.download_limit,
              // Service
              duration: data.duration,
              location: data.location,
              capacity: data.capacity,
            },
            requires_shipping: data.requires_shipping,
            taxable: true,
          },
        ],
      };

      if (isEditMode) {
        await updateProduct.mutateAsync({ id: productId!, data: dto });
      } else {
        const newProduct = await createProduct.mutateAsync(dto);
        // Redirect to edit mode after creation
        navigate(`/merchant/products/${newProduct.id}/edit`, { replace: true });
      }
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsDraft = () => {
    setValue('status', ProductStatus.DRAFT);
    handleSubmit((data) => onSubmit(data, false))();
  };

  const handlePublish = () => {
    handleSubmit((data) => onSubmit(data, true))();
  };

  const handlePreview = () => {
    if (productId && productId !== 'new') {
      window.open(`/product/${product?.slug || productId}`, '_blank');
    }
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoadingProduct && isEditMode) {
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
                  <p className="mt-3 text-muted">Loading product...</p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="merchant-layout">
      <Container fluid>
        <Row>
          {/* Sidebar */}
          <Col md={2} className="p-0">
            <MerchantSidebar />
          </Col>

          {/* Main Content */}
          <Col md={10} className="product-form-content">
            <Container fluid className="py-4">
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h2 className="fw-bold mb-0">
                    {isEditMode ? 'Edit Product' : 'Create New Product'}
                  </h2>
                  <p className="text-muted mb-0">
                    {isEditMode ? 'Update your product information' : 'Add a new product to your catalog'}
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/merchant/products')}
                  >
                    Cancel
                  </Button>
                  {isEditMode && (
                    <Button variant="outline-primary" onClick={handlePreview}>
                      Preview
                    </Button>
                  )}
                  <Button
                    variant="outline-primary"
                    onClick={handleSaveAsDraft}
                    disabled={isSaving || createProduct.isPending || updateProduct.isPending}
                  >
                    {isSaving ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      'Save as Draft'
                    )}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handlePublish}
                    disabled={isSaving || createProduct.isPending || updateProduct.isPending}
                  >
                    {isSaving ? 'Publishing...' : isEditMode ? 'Save Changes' : 'Publish'}
                  </Button>
                </div>
              </div>

              {/* Unsaved changes warning */}
              {isDirty && (
                <Alert variant="warning" className="mb-4">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  You have unsaved changes. Don't forget to save before leaving this page.
                </Alert>
              )}

              {/* Form Tabs */}
              <Form onSubmit={handleSubmit((data) => onSubmit(data, false))}>
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k || 'basic')}
                  className="mb-4"
                >
                  {/* Basic Information Tab */}
                  <Tab eventKey="basic" title="Basic Information">
                    <BasicInformationTab
                      control={control}
                      errors={errors}
                      watch={watch}
                      setValue={setValue}
                    />
                  </Tab>

                  {/* Images Tab */}
                  <Tab eventKey="images" title="Images">
                    <ImagesTab
                      control={control}
                      errors={errors}
                      watch={watch}
                      setValue={setValue}
                    />
                  </Tab>

                  {/* Pricing & Inventory Tab */}
                  <Tab eventKey="pricing" title="Pricing & Inventory">
                    <PricingInventoryTab
                      control={control}
                      errors={errors}
                      watch={watch}
                      productType={productType}
                    />
                  </Tab>

                  {/* SEO Tab */}
                  <Tab eventKey="seo" title="SEO">
                    <SEOTab control={control} errors={errors} watch={watch} />
                  </Tab>
                </Tabs>

                {/* Form Actions (Bottom) */}
                <div className="d-flex justify-content-between align-items-center pt-4 border-top">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/merchant/products')}
                  >
                    Cancel
                  </Button>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      onClick={handleSaveAsDraft}
                      disabled={isSaving || createProduct.isPending || updateProduct.isPending}
                    >
                      Save as Draft
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handlePublish}
                      disabled={isSaving || createProduct.isPending || updateProduct.isPending}
                    >
                      {isEditMode ? 'Save Changes' : 'Publish'}
                    </Button>
                  </div>
                </div>
              </Form>
            </Container>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
