import axios from 'axios';
import { store } from '@/store';
import type { RootState } from '@/store';
import { API_BASE_URL } from '@/utils/constants';

// Create a configured Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token automatically
apiClient.interceptors.request.use(
  (config) => {
    // Avoid circular dependency issues during initialization
    if (store) {
      const state = store.getState() as RootState;
      const token = state.auth?.token;

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global error handling
apiClient.interceptors.response.use(
  (response) => {
    // Return data natively where expected
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized globally
    if (error.response?.status === 401) {
      // You could dispatch a logout action here if you want to force logout
      // store.dispatch(logout());
      console.error('Unauthorized access - please log in again.');
    }

    // Standardize error message formats from the backend format `{ error: { message: ... } }`
    const customMessage = error.response?.data?.error?.message;
    if (customMessage) {
      error.message = customMessage;
    }

    return Promise.reject(error);
  }
);
