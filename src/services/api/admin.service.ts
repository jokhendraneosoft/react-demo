import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { AdminOverviewStats, AdminStatsRange } from '@/types/api';

export const adminService = {
  fetchOverviewStats: async (range: AdminStatsRange = 'all') => {
    const res = await apiClient.get<AdminOverviewStats>(API_ENDPOINTS.ADMIN.OVERVIEW_STATS, {
      params: { range },
    });
    return res.data;
  },
};
