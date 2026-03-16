import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

export interface UserPreferencesResponse {
  preferences?: {
    preferredTopics?: string[];
    theme?: 'light' | 'dark';
  };
}

export const userService = {
  fetchMe: async () => {
    const res = await apiClient.get<UserPreferencesResponse>(API_ENDPOINTS.USERS.ME);
    return res.data;
  },

  updatePreferences: async (payload: { preferredTopics: string[]; theme: 'light' | 'dark' }) => {
    await apiClient.put(API_ENDPOINTS.USERS.PREFERENCES, payload);
  },
};

