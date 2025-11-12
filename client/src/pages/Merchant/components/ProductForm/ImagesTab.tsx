/**
 * Images Tab
 *
 * Upload multiple images, drag & drop reorder, set primary image
 * Max 10 images, max 5MB each
 */

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Form, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import { useUploadProductImage } from '@/hooks';

interface ImagesTabProps {
  control: any;
  errors: any;
  watch: any;
  setValue: any;
}

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ImagesTab = ({ control, errors, watch, setValue }: ImagesTabProps) => {
  const images = watch('images') || [];
  const primaryImage = watch('image_url') || '';

  const [uploadError, setUploadError] = useState('');
  const [uploadingCount, setUploadingCount] = useState(0);

  const uploadImageMutation = useUploadProductImage();

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_IMAGES - images.length,
    onDrop: async (acceptedFiles, rejectedFiles) => {
      setUploadError('');

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map((file) => {
          if (file.errors[0]?.code === 'file-too-large') {
            return `${file.file.name}: File too large (max 5MB)`;
          }
          if (file.errors[0]?.code === 'file-invalid-type') {
            return `${file.file.name}: Invalid file type`;
          }
          return `${file.file.name}: ${file.errors[0]?.message}`;
        });
        setUploadError(errors.join(', '));
        return;
      }

      // Check total images limit
      if (images.length + acceptedFiles.length > MAX_IMAGES) {
        setUploadError(`Maximum ${MAX_IMAGES} images allowed`);
        return;
      }

      // Upload files
      setUploadingCount(acceptedFiles.length);

      const uploadPromises = acceptedFiles.map(async (file) => {
        try {
          const result = await uploadImageMutation.mutateAsync(file);
          return result.url;
        } catch (error) {
          console.error('Failed to upload image:', error);
          return null;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const successfulUploads = uploadedUrls.filter((url) => url !== null);

      // Add uploaded images to the list
      const newImages = [...images, ...successfulUploads];
      setValue('images', newImages, { shouldDirty: true });

      // Set first image as primary if no primary image exists
      if (!primaryImage && successfulUploads.length > 0) {
        setValue('image_url', successfulUploads[0], { shouldDirty: true });
      }

      setUploadingCount(0);
    },
  });

  // Handlers
  const handleSetPrimary = (url: string) => {
    setValue('image_url', url, { shouldDirty: true });
  };

  const handleRemoveImage = (url: string) => {
    const newImages = images.filter((img: string) => img !== url);
    setValue('images', newImages, { shouldDirty: true });

    // If removed image was primary, set first image as primary
    if (primaryImage === url) {
      setValue('image_url', newImages[0] || '', { shouldDirty: true });
    }
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setValue('images', newImages, { shouldDirty: true });
  };

  return (
    <div className="tab-content-wrapper">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
        style={{
          border: '2px dashed #dee2e6',
          borderRadius: '0.5rem',
          padding: '3rem',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? '#f8f9fa' : 'white',
          marginBottom: '2rem',
        }}
      >
        <input {...getInputProps()} />
        <div>
          <i
            className="bi bi-cloud-upload"
            style={{ fontSize: '3rem', color: '#6c757d' }}
          ></i>
          <h5 className="mt-3">
            {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
          </h5>
          <p className="text-muted">
            or click to browse (max {MAX_IMAGES} images, 5MB each)
          </p>
          <p className="text-muted small">
            Supported formats: JPG, PNG, GIF, WEBP
          </p>
        </div>
      </div>

      {/* Upload Error */}
      {uploadError && (
        <Alert variant="danger" dismissible onClose={() => setUploadError('')}>
          {uploadError}
        </Alert>
      )}

      {/* Uploading Progress */}
      {uploadingCount > 0 && (
        <Alert variant="info">
          <Spinner animation="border" size="sm" className="me-2" />
          Uploading {uploadingCount} image{uploadingCount > 1 ? 's' : ''}...
        </Alert>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <>
          <h6 className="mb-3">
            Product Images ({images.length}/{MAX_IMAGES})
          </h6>
          <Row className="g-3">
            {images.map((url: string, index: number) => (
              <Col key={url} md={3} sm={6}>
                <div
                  className="image-card"
                  style={{
                    position: 'relative',
                    border: primaryImage === url ? '3px solid #0d6efd' : '1px solid #dee2e6',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                  }}
                >
                  {/* Image */}
                  <img
                    src={url}
                    alt={`Product ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                    }}
                  />

                  {/* Primary Badge */}
                  {primaryImage === url && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        left: '0.5rem',
                        backgroundColor: '#0d6efd',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      }}
                    >
                      PRIMARY
                    </div>
                  )}

                  {/* Actions */}
                  <div
                    className="image-actions"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      padding: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    {/* Set Primary */}
                    {primaryImage !== url && (
                      <Button
                        size="sm"
                        variant="light"
                        onClick={() => handleSetPrimary(url)}
                      >
                        Set Primary
                      </Button>
                    )}

                    {/* Reorder Buttons */}
                    <div className="d-flex gap-1">
                      {index > 0 && (
                        <Button
                          size="sm"
                          variant="light"
                          onClick={() => handleMoveImage(index, index - 1)}
                          title="Move Left"
                        >
                          <i className="bi bi-arrow-left"></i>
                        </Button>
                      )}
                      {index < images.length - 1 && (
                        <Button
                          size="sm"
                          variant="light"
                          onClick={() => handleMoveImage(index, index + 1)}
                          title="Move Right"
                        >
                          <i className="bi bi-arrow-right"></i>
                        </Button>
                      )}
                    </div>

                    {/* Remove */}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemoveImage(url)}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <div className="mt-3 text-muted small">
            <i className="bi bi-info-circle me-2"></i>
            The primary image will be shown as the main product image. You can reorder images
            using the arrow buttons.
          </div>
        </>
      )}

      {images.length === 0 && (
        <Alert variant="info">
          No images uploaded yet. Add some images to showcase your product!
        </Alert>
      )}
    </div>
  );
};
