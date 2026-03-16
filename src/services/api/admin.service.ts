import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { AdminOverviewStats } from '@/types/api';

export const adminService = {
  fetchOverviewStats: async () => {
    const res = await apiClient.get<AdminOverviewStats>(API_ENDPOINTS.ADMIN.OVERVIEW_STATS);
    return res.data;
  },
};
