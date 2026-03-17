import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { CourseFeedback } from '@/types/api';

export const feedbackService = {
  fetchCourseFeedback: async (courseId: string) => {
    const res = await apiClient.get<CourseFeedback[]>(API_ENDPOINTS.FEEDBACK.BY_COURSE(courseId));
    return res.data;
  },

  upsertCourseFeedback: async (courseId: string, payload: { rating: number; comment?: string }) => {
    const res = await apiClient.post<CourseFeedback>(API_ENDPOINTS.FEEDBACK.BY_COURSE(courseId), payload);
    return res.data;
  },
};

