/**
 * Analyzing Step
 *
 * Shows AI analysis progress indicator.
 * Auto-proceeds to mapping step when analysis completes.
 */

import { useImportIsAnalyzing, useImportSession } from '@/store/importStore';

export const AnalyzingStep = () => {
  const isAnalyzing = useImportIsAnalyzing();
  const session = useImportSession();

  return (
    <div className="analyzing-step">
      <i className="bi bi-gear analyzing-icon"></i>

      <h4>Analyzing Your File</h4>
      <p className="text-muted">
        {isAnalyzing
          ? 'AI is analyzing your file structure and mapping columns...'
          : 'Preparing analysis...'}
      </p>

      {session && (
        <div className="mt-4">
          <div className="text-muted">
            <strong>File:</strong> {session.original_filename}
          </div>
          <div className="text-muted">
            <strong>Rows:</strong> {session.total_rows}
          </div>
          <div className="text-muted">
            <strong>Format:</strong> {session.file_format}
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="progress" style={{ height: '8px' }}>
          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            style={{ width: '100%' }}
          ></div>
        </div>
      </div>

      <p className="text-muted mt-3 small">
        This usually takes a few seconds...
      </p>
    </div>
  );
};

export default AnalyzingStep;
