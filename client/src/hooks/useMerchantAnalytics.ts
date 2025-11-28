/**
 * Merchant Analytics Hooks
 *
 * React Query hooks for fetching merchant analytics data
 */

import { useQuery } from '@tanstack/react-query';
import { merchantApi } from '@/api/merchant.api';
import type { AnalyticsData, AnalyticsQueryParams } from '@/types/merchant';

/**
 * Query keys for merchant analytics
 */
export const merchantAnalyticsKeys = {
  all: ['merchant', 'analytics'] as const,
  byParams: (params: AnalyticsQueryParams) =>
    [...merchantAnalyticsKeys.all, params] as const,
};

/**
 * Hook to fetch merchant analytics with date filters
 *
 * @param params - Query parameters (startDate, endDate, compare)
 * @returns Analytics data with loading and error states
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useAnalytics({
 *   startDate: '2025-01-01',
 *   endDate: '2025-01-31',
 *   compare: true
 * });
 * ```
 */
export const useAnalytics = (params: AnalyticsQueryParams = {}) => {
  return useQuery({
    queryKey: merchantAnalyticsKeys.byParams(params),
    queryFn: () => merchantApi.getAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};
