/**
 * Mapping Step
 *
 * Column mapping configuration step.
 * Shows detected columns, AI-suggested mappings, and allows manual override.
 */

import { useState } from 'react';
import { Table, Form, Badge, Button, Spinner } from 'react-bootstrap';
import {
  useImportAnalysisResult,
  useMatchImportProducts,
  useImportIsMatching,
  useUpdateImportMapping,
} from '@/store/importStore';
import type { ColumnMapping } from '@/api/import-export.api';

// Target fields for product mapping
const TARGET_FIELDS = [
  { value: '', label: '-- Skip --' },
  { value: 'product.title', label: 'Product Title' },
  { value: 'product.short_description', label: 'Short Description' },
  { value: 'product.description', label: 'Description' },
  { value: 'product.base_price_minor', label: 'Price' },
  { value: 'product.image_url', label: 'Image URL' },
  { value: 'product.category', label: 'Category' },
  { value: 'product.brand', label: 'Brand' },
  { value: 'variant.sku', label: 'SKU' },
  { value: 'variant.title', label: 'Variant Title' },
  { value: 'variant.price_minor', label: 'Variant Price' },
  { value: 'variant.compare_at_price_minor', label: 'Compare at Price' },
  { value: 'variant.inventory_quantity', label: 'Quantity' },
  { value: 'variant.barcode', label: 'Barcode' },
  { value: 'variant.weight', label: 'Weight' },
];

export const MappingStep = () => {
  const analysisResult = useImportAnalysisResult();
  const matchProducts = useMatchImportProducts();
  const updateMapping = useUpdateImportMapping();
  const isMatching = useImportIsMatching();

  const [mappings, setMappings] = useState<ColumnMapping[]>(
    analysisResult?.column_mapping || []
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    setMappings((prev) => {
      const existing = prev.find((m) => m.source_column === sourceColumn);
      if (existing) {
        return prev.map((m) =>
          m.source_column === sourceColumn
            ? { ...m, target_field: targetField, confidence: targetField ? 1.0 : 0 }
            : m
        );
      } else {
        return [
          ...prev,
          {
            source_column: sourceColumn,
            target_field: targetField,
            confidence: targetField ? 1.0 : 0,
          },
        ];
      }
    });
  };

  const handleSaveMapping = async () => {
    try {
      setIsSaving(true);
      await updateMapping(mappings);
    } catch (error) {
      console.error('Failed to save mapping:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = async () => {
    try {
      // Save mappings first
      await updateMapping(mappings);
      // Then run matching
      await matchProducts();
    } catch (error) {
      console.error('Failed to proceed:', error);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <Badge bg="success">High</Badge>;
    } else if (confidence >= 0.7) {
      return <Badge bg="warning">Medium</Badge>;
    } else if (confidence > 0) {
      return <Badge bg="danger">Low</Badge>;
    }
    return null;
  };

  const getCurrentMapping = (sourceColumn: string): string => {
    return mappings.find((m) => m.source_column === sourceColumn)?.target_field || '';
  };

  const getConfidence = (sourceColumn: string): number => {
    return mappings.find((m) => m.source_column === sourceColumn)?.confidence || 0;
  };

  const getSampleValue = (columnName: string): string => {
    if (!analysisResult?.sample_data || analysisResult.sample_data.length === 0) {
      return '';
    }
    return analysisResult.sample_data[0][columnName] || '';
  };

  if (!analysisResult) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading analysis results...</p>
      </div>
    );
  }

  const { detected_columns, suggestions, warnings } = analysisResult;

  return (
    <div className="mapping-step">
      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="alert alert-info mb-3">
          <h6 className="mb-2">
            <i className="bi bi-lightbulb me-2"></i>Suggestions:
          </h6>
          <ul className="mb-0 small">
            {suggestions.map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="alert alert-warning mb-3">
          <h6 className="mb-2">
            <i className="bi bi-exclamation-triangle me-2"></i>Warnings:
          </h6>
          <ul className="mb-0 small">
            {warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Mapping Header */}
      <div className="mapping-header">
        <h6 className="mb-0">
          Column Mapping ({detected_columns.length} columns detected)
        </h6>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={handleSaveMapping}
          disabled={isSaving}
        >
          {isSaving ? (
            <Spinner as="span" animation="border" size="sm" />
          ) : (
            <>
              <i className="bi bi-save me-1"></i>
              Save Mapping
            </>
          )}
        </Button>
      </div>

      {/* Mapping Table */}
      <Table responsive bordered className="mapping-table mt-3">
        <thead>
          <tr>
            <th style={{ width: '25%' }}>Source Column</th>
            <th style={{ width: '25%' }}>Sample Value</th>
            <th style={{ width: '35%' }}>Map To Field</th>
            <th style={{ width: '15%' }}>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {detected_columns.map((column) => (
            <tr key={column}>
              <td>
                <strong>{column}</strong>
              </td>
              <td className="sample-data">{getSampleValue(column)}</td>
              <td>
                <Form.Select
                  size="sm"
                  value={getCurrentMapping(column)}
                  onChange={(e) => handleMappingChange(column, e.target.value)}
                >
                  {TARGET_FIELDS.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </Form.Select>
              </td>
              <td className="mapping-confidence">
                {getConfidenceBadge(getConfidence(column))}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Continue Button */}
      <div className="mt-4 text-center">
        <Button
          variant="primary"
          size="lg"
          onClick={handleContinue}
          disabled={isMatching}
        >
          {isMatching ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                className="me-2"
              />
              Matching Products...
            </>
          ) : (
            <>
              <i className="bi bi-arrow-right me-2"></i>
              Continue to Review
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default MappingStep;
