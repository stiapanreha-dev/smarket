/**
 * Pricing & Inventory Tab
 *
 * Price, compare at price, cost per item, stock, SKU, barcode
 * Conditional fields for Digital and Service products
 */

import { Controller } from 'react-hook-form';
import { Form, Row, Col, InputGroup, Alert } from 'react-bootstrap';
import { ProductType } from '@/types/catalog';

interface PricingInventoryTabProps {
  control: any;
  errors: any;
  watch: any;
  productType: ProductType;
}

export const PricingInventoryTab = ({
  control,
  errors,
  watch,
  productType,
}: PricingInventoryTabProps) => {
  return (
    <div className="tab-content-wrapper">
      {/* Pricing Section */}
      <h5 className="mb-3">Pricing</h5>

      <Row>
        {/* Price */}
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>
              Price <span className="text-danger">*</span>
            </Form.Label>
            <Controller
              name="base_price_minor"
              control={control}
              render={({ field }) => (
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={field.value ? field.value / 100 : ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : Math.round(value * 100));
                    }}
                    isInvalid={!!errors.base_price_minor}
                  />
                </InputGroup>
              )}
            />
            <Form.Control.Feedback type="invalid">
              {errors.base_price_minor?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        {/* Compare at Price */}
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Compare at Price (Optional)</Form.Label>
            <Controller
              name="compare_at_price_minor"
              control={control}
              render={({ field }) => (
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={field.value ? field.value / 100 : ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? null : Math.round(value * 100));
                    }}
                    isInvalid={!!errors.compare_at_price_minor}
                  />
                </InputGroup>
              )}
            />
            <Form.Text className="text-muted">
              Show customers the original price to highlight discounts
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        {/* Cost per Item */}
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Cost per Item (Optional)</Form.Label>
            <Controller
              name="cost_per_item"
              control={control}
              render={({ field }) => (
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    isInvalid={!!errors.cost_per_item}
                  />
                </InputGroup>
              )}
            />
            <Form.Text className="text-muted">
              Your cost for this item (for profit calculations)
            </Form.Text>
          </Form.Group>
        </Col>

        {/* Currency */}
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Currency</Form.Label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Form.Select {...field}>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="RUB">RUB - Russian Ruble</option>
                </Form.Select>
              )}
            />
          </Form.Group>
        </Col>
      </Row>

      <hr className="my-4" />

      {/* Inventory Section (Physical Products Only) */}
      {productType === ProductType.PHYSICAL && (
        <>
          <h5 className="mb-3">Inventory</h5>

          <Row>
            {/* SKU */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>SKU (Stock Keeping Unit)</Form.Label>
                <Controller
                  name="sku"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="e.g. PROD-001"
                      isInvalid={!!errors.sku}
                    />
                  )}
                />
                <Form.Text className="text-muted">
                  Unique identifier for inventory tracking
                </Form.Text>
              </Form.Group>
            </Col>

            {/* Barcode */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Barcode (ISBN, UPC, etc.)</Form.Label>
                <Controller
                  name="barcode"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="e.g. 1234567890123"
                      isInvalid={!!errors.barcode}
                    />
                  )}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            {/* Stock Quantity */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Stock Quantity</Form.Label>
                <Controller
                  name="inventory_quantity"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="number"
                      min="0"
                      placeholder="0"
                      isInvalid={!!errors.inventory_quantity}
                    />
                  )}
                />
                <Form.Text className="text-muted">
                  Number of items available for sale
                </Form.Text>
              </Form.Group>
            </Col>

            {/* Weight */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Weight (kg)</Form.Label>
                <Controller
                  name="weight"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      isInvalid={!!errors.weight}
                    />
                  )}
                />
                <Form.Text className="text-muted">
                  Used for shipping calculations
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {/* Requires Shipping */}
          <Form.Group className="mb-3">
            <Controller
              name="requires_shipping"
              control={control}
              render={({ field }) => (
                <Form.Check
                  {...field}
                  type="checkbox"
                  label="This product requires shipping"
                  checked={field.value}
                />
              )}
            />
          </Form.Group>

          <hr className="my-4" />
        </>
      )}

      {/* Digital Product Fields */}
      {productType === ProductType.COURSE && (
        <>
          <h5 className="mb-3">Digital Product Settings</h5>

          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i>
            Upload your digital files (e.g., PDFs, videos, software) that customers will
            receive after purchase.
          </Alert>

          <Form.Group className="mb-3">
            <Form.Label>
              File URL <span className="text-danger">*</span>
            </Form.Label>
            <Controller
              name="file_url"
              control={control}
              render={({ field }) => (
                <Form.Control
                  {...field}
                  type="url"
                  placeholder="https://example.com/file.pdf"
                  isInvalid={!!errors.file_url}
                />
              )}
            />
            <Form.Control.Feedback type="invalid">
              {errors.file_url?.message}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Direct link to the downloadable file (stored in S3 or CDN)
            </Form.Text>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>File Size (MB)</Form.Label>
                <Controller
                  name="file_size"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      isInvalid={!!errors.file_size}
                    />
                  )}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>File Format</Form.Label>
                <Controller
                  name="file_format"
                  control={control}
                  render={({ field }) => (
                    <Form.Select {...field}>
                      <option value="">Select format</option>
                      <option value="PDF">PDF</option>
                      <option value="ZIP">ZIP</option>
                      <option value="MP4">MP4 (Video)</option>
                      <option value="MP3">MP3 (Audio)</option>
                      <option value="EPUB">EPUB (Ebook)</option>
                      <option value="Other">Other</option>
                    </Form.Select>
                  )}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Download Limit</Form.Label>
            <Controller
              name="download_limit"
              control={control}
              render={({ field }) => (
                <Form.Control
                  {...field}
                  type="number"
                  min="-1"
                  placeholder="-1 (unlimited)"
                  isInvalid={!!errors.download_limit}
                />
              )}
            />
            <Form.Text className="text-muted">
              Maximum number of downloads allowed per purchase (-1 for unlimited)
            </Form.Text>
          </Form.Group>

          <hr className="my-4" />
        </>
      )}

      {/* Service Fields */}
      {productType === ProductType.SERVICE && (
        <>
          <h5 className="mb-3">Service Settings</h5>

          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i>
            Configure booking settings for your service (consultations, appointments, etc.)
          </Alert>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Duration (minutes)</Form.Label>
                <Controller
                  name="duration"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="number"
                      min="0"
                      step="15"
                      placeholder="60"
                      isInvalid={!!errors.duration}
                    />
                  )}
                />
                <Form.Text className="text-muted">
                  How long does this service take? (e.g., 30, 60, 90 minutes)
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Capacity</Form.Label>
                <Controller
                  name="capacity"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="number"
                      min="1"
                      placeholder="1"
                      isInvalid={!!errors.capacity}
                    />
                  )}
                />
                <Form.Text className="text-muted">
                  Maximum number of bookings per time slot
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Location</Form.Label>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <Form.Control
                  {...field}
                  as="textarea"
                  rows={2}
                  placeholder="e.g., 123 Main St, City, State or 'Online via Zoom'"
                  isInvalid={!!errors.location}
                />
              )}
            />
            <Form.Text className="text-muted">
              Where will the service take place? (address or "Online")
            </Form.Text>
          </Form.Group>

          <hr className="my-4" />
        </>
      )}
    </div>
  );
};
