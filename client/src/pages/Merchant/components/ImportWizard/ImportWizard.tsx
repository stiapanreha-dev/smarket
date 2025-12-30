/**
 * Import Wizard
 *
 * Multi-step wizard for importing products from CSV/XLSX/YML files.
 * Steps:
 * 1. Upload - File selection and upload
 * 2. Analyzing - AI analysis progress
 * 3. Mapping - Column mapping configuration
 * 4. Reconciliation - Review and approve items
 * 5. Executing - Import progress
 * 6. Results - Import results summary
 */

import { Modal, ProgressBar } from 'react-bootstrap';
import {
  useImportIsOpen,
  useCloseImportModal,
  useImportCurrentStep,
  useImportError,
  ImportWizardStep,
} from '@/store/importStore';

import { UploadStep } from './steps/UploadStep';
import { AnalyzingStep } from './steps/AnalyzingStep';
import { MappingStep } from './steps/MappingStep';
import { ReconciliationStep } from './steps/ReconciliationStep';
import { ExecutingStep } from './steps/ExecutingStep';
import { ResultsStep } from './steps/ResultsStep';

import './ImportWizard.css';

const STEPS = [
  { key: ImportWizardStep.UPLOAD, label: 'Upload', number: 1 },
  { key: ImportWizardStep.ANALYZING, label: 'Analyzing', number: 2 },
  { key: ImportWizardStep.MAPPING, label: 'Mapping', number: 3 },
  { key: ImportWizardStep.RECONCILIATION, label: 'Review', number: 4 },
  { key: ImportWizardStep.EXECUTING, label: 'Importing', number: 5 },
  { key: ImportWizardStep.RESULTS, label: 'Results', number: 6 },
];

export const ImportWizard = () => {
  const isOpen = useImportIsOpen();
  const closeModal = useCloseImportModal();
  const currentStep = useImportCurrentStep();
  const error = useImportError();

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const getStepTitle = () => {
    switch (currentStep) {
      case ImportWizardStep.UPLOAD:
        return 'Import Products';
      case ImportWizardStep.ANALYZING:
        return 'Analyzing File';
      case ImportWizardStep.MAPPING:
        return 'Column Mapping';
      case ImportWizardStep.RECONCILIATION:
        return 'Review Items';
      case ImportWizardStep.EXECUTING:
        return 'Importing Products';
      case ImportWizardStep.RESULTS:
        return 'Import Complete';
      default:
        return 'Import Products';
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case ImportWizardStep.UPLOAD:
        return <UploadStep />;
      case ImportWizardStep.ANALYZING:
        return <AnalyzingStep />;
      case ImportWizardStep.MAPPING:
        return <MappingStep />;
      case ImportWizardStep.RECONCILIATION:
        return <ReconciliationStep />;
      case ImportWizardStep.EXECUTING:
        return <ExecutingStep />;
      case ImportWizardStep.RESULTS:
        return <ResultsStep />;
      default:
        return <UploadStep />;
    }
  };

  // Don't allow closing during execution
  const canClose =
    currentStep !== ImportWizardStep.EXECUTING &&
    currentStep !== ImportWizardStep.ANALYZING;

  return (
    <Modal
      show={isOpen}
      onHide={canClose ? closeModal : undefined}
      size="xl"
      centered
      backdrop={canClose ? true : 'static'}
      keyboard={canClose}
      className="import-wizard-modal"
    >
      <Modal.Header closeButton={canClose}>
        <Modal.Title>{getStepTitle()}</Modal.Title>
      </Modal.Header>

      {/* Progress Bar */}
      <div className="import-wizard-progress">
        <ProgressBar now={progress} variant="primary" />
        <div className="import-wizard-steps">
          {STEPS.map((step, index) => (
            <div
              key={step.key}
              className={`import-wizard-step ${
                index < currentStepIndex
                  ? 'completed'
                  : index === currentStepIndex
                    ? 'active'
                    : ''
              }`}
            >
              <div className="step-number">{step.number}</div>
              <div className="step-label">{step.label}</div>
            </div>
          ))}
        </div>
      </div>

      <Modal.Body className="import-wizard-body">
        {error && (
          <div className="alert alert-danger mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}
        {renderStep()}
      </Modal.Body>
    </Modal>
  );
};

export default ImportWizard;
