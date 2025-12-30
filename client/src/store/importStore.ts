import { create } from 'zustand';
import importExportApi from '@/api/import-export.api';
import type {
  ImportSession,
  ImportItem,
  ImportStats,
  AnalysisResult,
  ColumnMapping,
  ImportItemStatus,
  ExportProductsParams,
} from '@/api/import-export.api';

// Wizard steps
export enum ImportWizardStep {
  UPLOAD = 'upload',
  ANALYZING = 'analyzing',
  MAPPING = 'mapping',
  RECONCILIATION = 'reconciliation',
  EXECUTING = 'executing',
  RESULTS = 'results',
}

interface ImportState {
  // Modal state
  isOpen: boolean;

  // Wizard state
  currentStep: ImportWizardStep;

  // Session data
  session: ImportSession | null;
  analysisResult: AnalysisResult | null;
  stats: ImportStats | null;

  // Items pagination
  items: ImportItem[];
  itemsTotal: number;
  itemsPage: number;
  itemsLimit: number;
  itemsFilter: ImportItemStatus | null;

  // Loading states
  isUploading: boolean;
  isAnalyzing: boolean;
  isMatching: boolean;
  isExecuting: boolean;
  isLoadingItems: boolean;
  isExporting: boolean;

  // Error state
  error: string | null;

  // Actions
  openModal: () => void;
  closeModal: () => void;
  setStep: (step: ImportWizardStep) => void;

  // Import flow actions
  uploadFile: (file: File) => Promise<void>;
  analyzeSession: () => Promise<void>;
  matchProducts: () => Promise<void>;
  loadItems: (page?: number, status?: ImportItemStatus | null) => Promise<void>;
  loadStats: () => Promise<void>;
  updateItem: (itemId: string, params: Partial<ImportItem>) => Promise<void>;
  approveAll: (statuses?: ImportItemStatus[]) => Promise<void>;
  executeImport: () => Promise<void>;
  cancelImport: () => Promise<void>;
  updateMapping: (mappings: ColumnMapping[]) => Promise<void>;
  resolveConflict: (
    itemId: string,
    action: 'update' | 'skip' | 'insert'
  ) => Promise<void>;

  // Export
  exportProducts: (params?: ExportProductsParams) => Promise<void>;

  // Reset
  reset: () => void;
}

const initialState = {
  isOpen: false,
  currentStep: ImportWizardStep.UPLOAD,
  session: null,
  analysisResult: null,
  stats: null,
  items: [],
  itemsTotal: 0,
  itemsPage: 1,
  itemsLimit: 50,
  itemsFilter: null,
  isUploading: false,
  isAnalyzing: false,
  isMatching: false,
  isExecuting: false,
  isLoadingItems: false,
  isExporting: false,
  error: null,
};

export const useImportStore = create<ImportState>((set, get) => ({
  ...initialState,

  openModal: () => set({ isOpen: true }),

  closeModal: () => {
    set({ isOpen: false });
    // Reset state when closing
    setTimeout(() => {
      get().reset();
    }, 300);
  },

  setStep: (step: ImportWizardStep) => set({ currentStep: step }),

  uploadFile: async (file: File) => {
    try {
      set({ isUploading: true, error: null });

      const response = await importExportApi.uploadFile(file);

      set({
        session: {
          id: response.session_id,
          status: response.status,
          file_format: response.file_format,
          total_rows: response.total_rows,
          original_filename: file.name,
          processed_rows: 0,
          success_count: 0,
          error_count: 0,
          new_count: 0,
          update_count: 0,
          skip_count: 0,
          analysis_result: response.analysis_result,
          error_message: null,
          created_at: new Date().toISOString(),
          completed_at: null,
        },
        analysisResult: response.analysis_result,
        isUploading: false,
        currentStep: ImportWizardStep.ANALYZING,
      });

      // Auto-start analysis
      await get().analyzeSession();
    } catch (error) {
      set({
        isUploading: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      });
      throw error;
    }
  },

  analyzeSession: async () => {
    const { session } = get();
    if (!session) return;

    try {
      set({ isAnalyzing: true, error: null });

      const response = await importExportApi.analyzeSession(session.id);

      set({
        session: {
          ...session,
          status: response.status,
          analysis_result: response.analysis_result,
        },
        analysisResult: response.analysis_result,
        isAnalyzing: false,
        currentStep: ImportWizardStep.MAPPING,
      });
    } catch (error) {
      set({
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      });
      throw error;
    }
  },

  matchProducts: async () => {
    const { session } = get();
    if (!session) return;

    try {
      set({ isMatching: true, error: null });

      const response = await importExportApi.matchProducts(session.id);

      set({
        stats: response.stats,
        isMatching: false,
        currentStep: ImportWizardStep.RECONCILIATION,
      });

      // Load items
      await get().loadItems(1);
    } catch (error) {
      set({
        isMatching: false,
        error: error instanceof Error ? error.message : 'Matching failed',
      });
      throw error;
    }
  },

  loadItems: async (page: number = 1, status: ImportItemStatus | null = null) => {
    const { session, itemsLimit } = get();
    if (!session) return;

    try {
      set({ isLoadingItems: true, error: null });

      const response = await importExportApi.getItems(
        session.id,
        page,
        itemsLimit,
        status || undefined
      );

      set({
        items: response.items,
        itemsTotal: response.total,
        itemsPage: response.page,
        itemsFilter: status,
        isLoadingItems: false,
      });
    } catch (error) {
      set({
        isLoadingItems: false,
        error: error instanceof Error ? error.message : 'Failed to load items',
      });
      throw error;
    }
  },

  loadStats: async () => {
    const { session } = get();
    if (!session) return;

    try {
      const stats = await importExportApi.getStats(session.id);
      set({ stats });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load stats',
      });
      throw error;
    }
  },

  updateItem: async (itemId: string, params: Partial<ImportItem>) => {
    const { session } = get();
    if (!session) return;

    try {
      const updatedItem = await importExportApi.updateItem(
        session.id,
        itemId,
        params
      );

      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId ? updatedItem : item
        ),
      }));

      // Refresh stats
      await get().loadStats();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update item',
      });
      throw error;
    }
  },

  approveAll: async (statuses?: ImportItemStatus[]) => {
    const { session } = get();
    if (!session) return;

    try {
      await importExportApi.approveAll(session.id, { statuses });

      // Refresh items and stats
      await Promise.all([get().loadItems(get().itemsPage), get().loadStats()]);
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to approve items',
      });
      throw error;
    }
  },

  executeImport: async () => {
    const { session } = get();
    if (!session) return;

    try {
      set({
        isExecuting: true,
        error: null,
        currentStep: ImportWizardStep.EXECUTING,
      });

      const response = await importExportApi.executeImport(session.id);

      set({
        session: {
          ...session,
          status: response.status,
          success_count: response.success_count,
          error_count: response.error_count,
          new_count: response.new_count,
          update_count: response.update_count,
          skip_count: response.skip_count,
          completed_at: response.completed_at,
        },
        isExecuting: false,
        currentStep: ImportWizardStep.RESULTS,
      });
    } catch (error) {
      set({
        isExecuting: false,
        error: error instanceof Error ? error.message : 'Import failed',
      });
      throw error;
    }
  },

  cancelImport: async () => {
    const { session } = get();
    if (!session) return;

    try {
      await importExportApi.cancelSession(session.id);
      get().closeModal();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to cancel',
      });
      throw error;
    }
  },

  updateMapping: async (mappings: ColumnMapping[]) => {
    const { session } = get();
    if (!session) return;

    try {
      const response = await importExportApi.updateMapping(session.id, mappings);

      set({
        analysisResult: response.analysis_result,
        session: {
          ...session,
          analysis_result: response.analysis_result,
        },
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update mapping',
      });
      throw error;
    }
  },

  resolveConflict: async (
    itemId: string,
    action: 'update' | 'skip' | 'insert'
  ) => {
    const { session } = get();
    if (!session) return;

    try {
      const updatedItem = await importExportApi.resolveConflict(
        session.id,
        itemId,
        action
      );

      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId ? updatedItem : item
        ),
      }));

      // Refresh stats
      await get().loadStats();
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to resolve conflict',
      });
      throw error;
    }
  },

  exportProducts: async (params: ExportProductsParams = {}) => {
    try {
      set({ isExporting: true, error: null });

      const blob = await importExportApi.exportProducts(params);

      // Download file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `products_export_${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      set({ isExporting: false });
    } catch (error) {
      set({
        isExporting: false,
        error: error instanceof Error ? error.message : 'Export failed',
      });
      throw error;
    }
  },

  reset: () => set(initialState),
}));

// Atomic selectors - CRITICAL: Each selector returns a single primitive value
export const useImportIsOpen = () => useImportStore((state) => state.isOpen);
export const useImportCurrentStep = () =>
  useImportStore((state) => state.currentStep);
export const useImportSession = () => useImportStore((state) => state.session);
export const useImportAnalysisResult = () =>
  useImportStore((state) => state.analysisResult);
export const useImportStats = () => useImportStore((state) => state.stats);
export const useImportItems = () => useImportStore((state) => state.items);
export const useImportItemsTotal = () =>
  useImportStore((state) => state.itemsTotal);
export const useImportItemsPage = () =>
  useImportStore((state) => state.itemsPage);
export const useImportItemsFilter = () =>
  useImportStore((state) => state.itemsFilter);
export const useImportIsUploading = () =>
  useImportStore((state) => state.isUploading);
export const useImportIsAnalyzing = () =>
  useImportStore((state) => state.isAnalyzing);
export const useImportIsMatching = () =>
  useImportStore((state) => state.isMatching);
export const useImportIsExecuting = () =>
  useImportStore((state) => state.isExecuting);
export const useImportIsLoadingItems = () =>
  useImportStore((state) => state.isLoadingItems);
export const useImportIsExporting = () =>
  useImportStore((state) => state.isExporting);
export const useImportError = () => useImportStore((state) => state.error);

// Action selectors
export const useOpenImportModal = () =>
  useImportStore((state) => state.openModal);
export const useCloseImportModal = () =>
  useImportStore((state) => state.closeModal);
export const useSetImportStep = () => useImportStore((state) => state.setStep);
export const useUploadImportFile = () =>
  useImportStore((state) => state.uploadFile);
export const useAnalyzeImportSession = () =>
  useImportStore((state) => state.analyzeSession);
export const useMatchImportProducts = () =>
  useImportStore((state) => state.matchProducts);
export const useLoadImportItems = () =>
  useImportStore((state) => state.loadItems);
export const useLoadImportStats = () =>
  useImportStore((state) => state.loadStats);
export const useUpdateImportItem = () =>
  useImportStore((state) => state.updateItem);
export const useApproveAllImportItems = () =>
  useImportStore((state) => state.approveAll);
export const useExecuteImport = () =>
  useImportStore((state) => state.executeImport);
export const useCancelImport = () =>
  useImportStore((state) => state.cancelImport);
export const useUpdateImportMapping = () =>
  useImportStore((state) => state.updateMapping);
export const useResolveImportConflict = () =>
  useImportStore((state) => state.resolveConflict);
export const useExportProducts = () =>
  useImportStore((state) => state.exportProducts);
export const useResetImport = () => useImportStore((state) => state.reset);

export default useImportStore;
