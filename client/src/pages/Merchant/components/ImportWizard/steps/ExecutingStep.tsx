/**
 * Executing Step
 *
 * Shows import execution progress.
 */

import { useImportSession } from '@/store/importStore';

export const ExecutingStep = () => {
  const session = useImportSession();

  const processedRows = session?.processed_rows || 0;
  const totalRows = session?.total_rows || 1;
  const progress = Math.round((processedRows / totalRows) * 100);

  return (
    <div className="executing-step">
      <i className="bi bi-arrow-repeat" style={{ fontSize: '4rem', color: '#7fb3d5' }}></i>

      <h4 className="mt-4">Importing Products</h4>
      <p className="text-muted">Please wait while we import your products...</p>

      <div className="progress mt-4" style={{ height: '25px' }}>
        <div
          className="progress-bar progress-bar-striped progress-bar-animated"
          role="progressbar"
          style={{ width: `${progress}%` }}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {progress}%
        </div>
      </div>

      <div className="executing-stats">
        <div className="stat">
          <div className="value">{processedRows}</div>
          <div className="label">Processed</div>
        </div>
        <div className="stat">
          <div className="value">{totalRows}</div>
          <div className="label">Total</div>
        </div>
        {session && (
          <>
            <div className="stat">
              <div className="value text-success">{session.success_count}</div>
              <div className="label">Success</div>
            </div>
            <div className="stat">
              <div className="value text-danger">{session.error_count}</div>
              <div className="label">Errors</div>
            </div>
          </>
        )}
      </div>

      <p className="text-muted mt-4 small">
        <i className="bi bi-info-circle me-1"></i>
        Do not close this window. Import may take a few minutes for large files.
      </p>
    </div>
  );
};

export default ExecutingStep;
