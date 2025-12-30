/**
 * Results Step
 *
 * Shows import results summary.
 */

import { Button } from 'react-bootstrap';
import { useImportSession, useCloseImportModal } from '@/store/importStore';

export const ResultsStep = () => {
  const session = useImportSession();
  const closeModal = useCloseImportModal();

  if (!session) {
    return <div className="text-center py-4">No results available</div>;
  }

  const {
    success_count,
    error_count,
    new_count,
    update_count,
    skip_count,
  } = session;

  const hasErrors = error_count > 0;
  const isSuccess = success_count > 0 && !hasErrors;

  return (
    <div className="results-step">
      {/* Header */}
      <div className="results-header">
        <i
          className={`bi ${
            isSuccess
              ? 'bi-check-circle-fill results-icon success'
              : hasErrors
                ? 'bi-exclamation-circle-fill results-icon warning'
                : 'bi-info-circle-fill results-icon'
          }`}
        ></i>
        <h3>
          {isSuccess
            ? 'Import Completed Successfully!'
            : hasErrors
              ? 'Import Completed with Errors'
              : 'Import Complete'}
        </h3>
        <p className="text-muted">
          {success_count} product{success_count !== 1 ? 's' : ''} were imported
          successfully.
        </p>
      </div>

      {/* Summary */}
      <div className="results-summary">
        <div className="summary-card">
          <div className="value text-success">{success_count}</div>
          <div className="label">Successful</div>
        </div>
        <div className="summary-card">
          <div className="value text-primary">{new_count}</div>
          <div className="label">New Products</div>
        </div>
        <div className="summary-card">
          <div className="value text-info">{update_count}</div>
          <div className="label">Updated</div>
        </div>
        <div className="summary-card">
          <div className="value text-secondary">{skip_count}</div>
          <div className="label">Skipped</div>
        </div>
        {error_count > 0 && (
          <div className="summary-card">
            <div className="value text-danger">{error_count}</div>
            <div className="label">Errors</div>
          </div>
        )}
      </div>

      {/* Error Details */}
      {error_count > 0 && (
        <div className="alert alert-danger mt-3">
          <h6>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error_count} item{error_count !== 1 ? 's' : ''} failed to import
          </h6>
          <p className="mb-0 small">
            Some items could not be imported due to validation errors or other issues.
            You can download the error report or try importing again.
          </p>
        </div>
      )}

      {/* Success Message */}
      {isSuccess && (
        <div className="alert alert-success mt-3">
          <i className="bi bi-check-circle me-2"></i>
          All products have been imported successfully. You can view them in your
          products list.
        </div>
      )}

      {/* Actions */}
      <div className="results-actions">
        <Button variant="primary" onClick={closeModal}>
          <i className="bi bi-grid me-2"></i>
          View Products
        </Button>
        {error_count > 0 && (
          <Button variant="outline-secondary">
            <i className="bi bi-download me-2"></i>
            Download Error Report
          </Button>
        )}
      </div>
    </div>
  );
};

export default ResultsStep;
