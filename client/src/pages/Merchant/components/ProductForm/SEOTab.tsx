/**
 * SEO Tab
 *
 * Meta title, meta description, URL slug
 */

import { Controller } from 'react-hook-form';
import { Form, Alert } from 'react-bootstrap';

interface SEOTabProps {
  control: any;
  errors: any;
  watch: any;
}

export const SEOTab = ({ control, errors, watch }: SEOTabProps) => {
  const metaTitle = watch('meta_title') || '';
  const metaDescription = watch('meta_description') || '';
  const slug = watch('slug') || '';

  return (
    <div className="tab-content-wrapper">
      <Alert variant="info">
        <i className="bi bi-info-circle me-2"></i>
        <strong>Search Engine Optimization:</strong> Help your product rank better in search
        results by optimizing these fields. Good SEO can significantly increase visibility and
        sales.
      </Alert>

      {/* Page Title */}
      <Form.Group className="mb-4">
        <Form.Label>SEO Title (Meta Title)</Form.Label>
        <Controller
          name="meta_title"
          control={control}
          render={({ field }) => (
            <Form.Control
              {...field}
              type="text"
              placeholder="Enter SEO-friendly title"
              maxLength={60}
              isInvalid={!!errors.meta_title}
            />
          )}
        />
        <div className="d-flex justify-content-between mt-1">
          <Form.Text className="text-muted">
            Appears as the page title in search results (recommended: 50-60 characters)
          </Form.Text>
          <Form.Text className={metaTitle.length > 60 ? 'text-danger' : 'text-muted'}>
            {metaTitle.length}/60
          </Form.Text>
        </div>
        <Form.Control.Feedback type="invalid">
          {errors.meta_title?.message}
        </Form.Control.Feedback>
      </Form.Group>

      {/* Meta Description */}
      <Form.Group className="mb-4">
        <Form.Label>SEO Description (Meta Description)</Form.Label>
        <Controller
          name="meta_description"
          control={control}
          render={({ field }) => (
            <Form.Control
              {...field}
              as="textarea"
              rows={3}
              placeholder="Enter a compelling description for search results"
              maxLength={160}
              isInvalid={!!errors.meta_description}
            />
          )}
        />
        <div className="d-flex justify-content-between mt-1">
          <Form.Text className="text-muted">
            Appears as the description in search results (recommended: 150-160 characters)
          </Form.Text>
          <Form.Text className={metaDescription.length > 160 ? 'text-danger' : 'text-muted'}>
            {metaDescription.length}/160
          </Form.Text>
        </div>
        <Form.Control.Feedback type="invalid">
          {errors.meta_description?.message}
        </Form.Control.Feedback>
      </Form.Group>

      {/* URL Slug */}
      <Form.Group className="mb-4">
        <Form.Label>URL Slug</Form.Label>
        <Controller
          name="slug"
          control={control}
          render={({ field }) => (
            <Form.Control
              {...field}
              type="text"
              placeholder="product-url-slug"
              isInvalid={!!errors.slug}
            />
          )}
        />
        <Form.Text className="text-muted">
          Clean URL for your product page (e.g., "organic-cotton-t-shirt")
          <br />
          Only lowercase letters, numbers, and hyphens. Auto-generated from title if left empty.
        </Form.Text>
        <Form.Control.Feedback type="invalid">
          {errors.slug?.message}
        </Form.Control.Feedback>
        {slug && (
          <div className="mt-2">
            <small className="text-muted">
              Preview: <code>https://yoursite.com/catalog/{slug}</code>
            </small>
          </div>
        )}
      </Form.Group>

      <hr className="my-4" />

      {/* SEO Preview */}
      <h6 className="mb-3">Search Engine Preview</h6>
      <div
        className="seo-preview"
        style={{
          border: '1px solid #dee2e6',
          borderRadius: '0.5rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
        }}
      >
        <div className="seo-preview-title" style={{ color: '#1a0dab', fontSize: '1.125rem' }}>
          {metaTitle || 'Your Product Title'}
        </div>
        <div className="seo-preview-url" style={{ color: '#006621', fontSize: '0.875rem' }}>
          https://yoursite.com/catalog/{slug || 'product-slug'}
        </div>
        <div className="seo-preview-description" style={{ color: '#545454', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {metaDescription || 'Your product description will appear here in search results. Make it compelling to encourage clicks!'}
        </div>
      </div>

      <div className="mt-3">
        <h6>SEO Tips:</h6>
        <ul className="small text-muted">
          <li>Include relevant keywords naturally in your title and description</li>
          <li>Make your title and description compelling to encourage clicks</li>
          <li>Keep your URL slug short, descriptive, and keyword-rich</li>
          <li>Avoid keyword stuffing - write for humans, not just search engines</li>
          <li>Make each product's SEO content unique - don't duplicate across products</li>
        </ul>
      </div>
    </div>
  );
};
