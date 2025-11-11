/**
 * Merchant Dashboard Hooks
 *
 * React Query hooks for fetching merchant dashboard data
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/axios.config';
import type { DashboardStats } from '@/types';

/**
 * Query keys for merchant dashboard
 */
export const merchantDashboardKeys = {
  all: ['merchant', 'dashboard'] as const,
  stats: () => [...merchantDashboardKeys.all, 'stats'] as const,
};

/**
 * Fetch merchant dashboard statistics
 */
const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get<DashboardStats>('/merchant/dashboard/stats');
  return response.data;
};

/**
 * Hook to fetch merchant dashboard statistics
 *
 * @returns Dashboard statistics with loading and error states
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading, error } = useDashboardStats();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 *
 * return <DashboardStats stats={stats} />;
 * ```
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: merchantDashboardKeys.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
  });
};
