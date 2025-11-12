// Re-export all API functions for compatibility
export * from '../api';

// Also export as named 'api' for convenience
import * as apiModule from '../api';
export const api = apiModule;
