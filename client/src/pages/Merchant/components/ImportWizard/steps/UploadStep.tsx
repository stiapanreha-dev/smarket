/**
 * Upload Step
 *
 * First step of the import wizard - file selection and upload.
 * Supports drag-and-drop and file picker.
 */

import { useState, useCallback, useRef } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import {
  useUploadImportFile,
  useImportIsUploading,
} from '@/store/importStore';

const ACCEPTED_FORMATS = [
  '.csv',
  '.xlsx',
  '.xls',
  '.yml',
  '.xml',
  '.json',
];

const FORMAT_INFO = [
  { format: 'CSV', desc: 'Comma or semicolon separated' },
  { format: 'Excel', desc: '.xlsx, .xls files' },
  { format: 'YML', desc: 'Yandex.Market format' },
  { format: 'JSON', desc: 'Array of objects' },
];

export const UploadStep = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useUploadImportFile();
  const isUploading = useImportIsUploading();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
      }
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        setSelectedFile(files[0]);
      }
    },
    []
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadFile(selectedFile);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isValidFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return ACCEPTED_FORMATS.includes(extension);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'csv':
        return 'bi-filetype-csv';
      case 'xlsx':
      case 'xls':
        return 'bi-file-earmark-excel';
      case 'yml':
      case 'xml':
        return 'bi-filetype-xml';
      case 'json':
        return 'bi-filetype-json';
      default:
        return 'bi-file-earmark';
    }
  };

  return (
    <div className="upload-step">
      {/* Dropzone */}
      <div
        className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${
          selectedFile ? 'has-file' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!selectedFile ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FORMATS.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {!selectedFile ? (
          <>
            <i className="bi bi-cloud-upload upload-icon"></i>
            <div className="upload-text">
              <strong>Drop file here</strong> or click to browse
            </div>
            <div className="upload-hint">
              Supports CSV, Excel, YML (Yandex.Market), JSON
            </div>
          </>
        ) : (
          <div className="selected-file-info text-center">
            <i className={`bi ${getFileIcon(selectedFile.name)} upload-icon text-success`}></i>
            <div className="upload-text">
              <strong>{selectedFile.name}</strong>
            </div>
            <div className="upload-hint">
              {formatFileSize(selectedFile.size)}
            </div>
          </div>
        )}
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="selected-file">
          <i className={`bi ${getFileIcon(selectedFile.name)} file-icon`}></i>
          <div className="file-info">
            <div className="file-name">{selectedFile.name}</div>
            <div className="file-size">{formatFileSize(selectedFile.size)}</div>
          </div>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={handleRemoveFile}
            disabled={isUploading}
          >
            <i className="bi bi-x-lg"></i>
          </Button>
        </div>
      )}

      {/* Supported Formats Info */}
      <div className="mt-4">
        <h6 className="text-muted mb-3">Supported formats:</h6>
        <div className="row">
          {FORMAT_INFO.map((item) => (
            <div key={item.format} className="col-md-3 col-6 mb-2">
              <div className="d-flex align-items-center">
                <i className="bi bi-check-circle text-success me-2"></i>
                <div>
                  <strong>{item.format}</strong>
                  <div className="text-muted small">{item.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Button */}
      <div className="mt-4 text-center">
        <Button
          variant="primary"
          size="lg"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                className="me-2"
              />
              Uploading...
            </>
          ) : (
            <>
              <i className="bi bi-upload me-2"></i>
              Upload and Analyze
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default UploadStep;
