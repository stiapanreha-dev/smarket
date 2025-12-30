import api from './axios.config';

// Types - defined in dependency order

export type ImportSessionStatus =
  | 'pending'
  | 'parsing'
  | 'parsed'
  | 'analyzing'
  | 'analyzed'
  | 'reconciling'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ImportFileFormat = 'CSV' | 'XLSX' | 'XLS' | 'YML' | 'XML' | 'JSON';

export interface ColumnMapping {
  source_column: string;
  target_field: string;
  confidence: number;
  transformation?: string;
}

export interface AnalysisResult {
  detected_columns: string[];
  column_mapping: ColumnMapping[];
  suggestions: string[];
  warnings: string[];
  sample_data: Record<string, string>[];
}

export interface ImportSession {
  id: string;
  status: ImportSessionStatus;
  file_format: ImportFileFormat;
  original_filename: string;
  total_rows: number;
  processed_rows: number;
  success_count: number;
  error_count: number;
  new_count: number;
  update_count: number;
  skip_count: number;
  analysis_result: AnalysisResult | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ImportItem {
  id: string;
  session_id: string;
  row_number: number;
  status: ImportItemStatus;
  action: ImportItemAction;
  raw_data: Record<string, string>;
  mapped_data: MappedData | null;
  matched_product_id: string | null;
  matched_variant_id: string | null;
  matched_by: MatchMethod | null;
  match_confidence: number | null;
  changes: FieldChange[] | null;
  validation_errors: string[] | null;
  error_message: string | null;
  created_product_id: string | null;
  created_variant_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ImportItemStatus =
  | 'pending'
  | 'matched'
  | 'new'
  | 'conflict'
  | 'approved'
  | 'rejected'
  | 'imported'
  | 'error';

export type ImportItemAction = 'insert' | 'update' | 'skip';

export type MatchMethod = 'sku' | 'title' | 'barcode' | 'manual' | 'ai';

export interface MappedData {
  product: Record<string, unknown>;
  variant: Record<string, unknown>;
}

export interface FieldChange {
  field: string;
  old_value: string | number | null;
  new_value: string | number | null;
}

export interface ImportStats {
  total: number;
  matched: number;
  new: number;
  conflicts: number;
  errors: number;
  pending: number;
}

export interface PaginatedImportItems {
  items: ImportItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExportProductsParams {
  product_ids?: string[];
  include_variants?: boolean;
  include_deleted?: boolean;
}

export interface UploadResponse {
  session_id: string;
  status: ImportSessionStatus;
  total_rows: number;
  file_format: ImportFileFormat;
  analysis_result: AnalysisResult;
}

export interface AnalyzeResponse {
  id: string;
  status: ImportSessionStatus;
  analysis_result: AnalysisResult;
}

export interface MatchResponse {
  session_id: string;
  status: string;
  stats: ImportStats;
}

export interface ExecuteResponse {
  id: string;
  status: ImportSessionStatus;
  success_count: number;
  error_count: number;
  new_count: number;
  update_count: number;
  skip_count: number;
  completed_at: string;
}

export interface ApproveAllParams {
  statuses?: ImportItemStatus[];
}

export interface UpdateItemParams {
  status?: ImportItemStatus;
  action?: ImportItemAction;
  matched_product_id?: string;
  matched_variant_id?: string;
  mapped_data?: MappedData;
}

// API functions
export const importExportApi = {
  /**
   * Export products to CSV
   */
  exportProducts: async (params: ExportProductsParams = {}): Promise<Blob> => {
    const response = await api.post('/merchant/products/export', params, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Upload and parse import file
   */
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadResponse>(
      '/merchant/products/import/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Get import session by ID
   */
  getSession: async (sessionId: string): Promise<ImportSession> => {
    const response = await api.get<ImportSession>(
      `/merchant/products/import/${sessionId}`
    );
    return response.data;
  },

  /**
   * Run AI analysis on import session
   */
  analyzeSession: async (sessionId: string): Promise<AnalyzeResponse> => {
    const response = await api.post<AnalyzeResponse>(
      `/merchant/products/import/${sessionId}/analyze`
    );
    return response.data;
  },

  /**
   * Run product matching on import session
   */
  matchProducts: async (sessionId: string): Promise<MatchResponse> => {
    const response = await api.post<MatchResponse>(
      `/merchant/products/import/${sessionId}/match`
    );
    return response.data;
  },

  /**
   * Get import items with pagination
   */
  getItems: async (
    sessionId: string,
    page: number = 1,
    limit: number = 50,
    status?: ImportItemStatus
  ): Promise<PaginatedImportItems> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status) {
      params.append('status', status);
    }

    const response = await api.get<PaginatedImportItems>(
      `/merchant/products/import/${sessionId}/items?${params}`
    );
    return response.data;
  },

  /**
   * Get match statistics for session
   */
  getStats: async (sessionId: string): Promise<ImportStats> => {
    const response = await api.get<ImportStats>(
      `/merchant/products/import/${sessionId}/stats`
    );
    return response.data;
  },

  /**
   * Update import item
   */
  updateItem: async (
    sessionId: string,
    itemId: string,
    params: UpdateItemParams
  ): Promise<ImportItem> => {
    const response = await api.patch<ImportItem>(
      `/merchant/products/import/${sessionId}/items/${itemId}`,
      params
    );
    return response.data;
  },

  /**
   * Approve all items
   */
  approveAll: async (
    sessionId: string,
    params: ApproveAllParams = {}
  ): Promise<{ approved: number }> => {
    const response = await api.post<{ approved: number }>(
      `/merchant/products/import/${sessionId}/approve-all`,
      params
    );
    return response.data;
  },

  /**
   * Execute import
   */
  executeImport: async (sessionId: string): Promise<ExecuteResponse> => {
    const response = await api.post<ExecuteResponse>(
      `/merchant/products/import/${sessionId}/execute`
    );
    return response.data;
  },

  /**
   * Cancel import session
   */
  cancelSession: async (
    sessionId: string
  ): Promise<{ id: string; status: ImportSessionStatus }> => {
    const response = await api.post<{ id: string; status: ImportSessionStatus }>(
      `/merchant/products/import/${sessionId}/cancel`
    );
    return response.data;
  },

  /**
   * Update column mapping
   */
  updateMapping: async (
    sessionId: string,
    mappings: ColumnMapping[]
  ): Promise<AnalyzeResponse> => {
    const response = await api.patch<AnalyzeResponse>(
      `/merchant/products/import/${sessionId}/mapping`,
      { mappings }
    );
    return response.data;
  },

  /**
   * Resolve conflict for specific item
   */
  resolveConflict: async (
    sessionId: string,
    itemId: string,
    action: 'update' | 'skip' | 'insert'
  ): Promise<ImportItem> => {
    const response = await api.post<ImportItem>(
      `/merchant/products/import/${sessionId}/items/${itemId}/resolve`,
      { action }
    );
    return response.data;
  },
};

export default importExportApi;
