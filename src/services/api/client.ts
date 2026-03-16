import axios from 'axios';
import { store } from '@/store';
import type { RootState } from '@/store';
import { API_BASE_URL } from '@/utils/constants';
import { API_ENDPOINTS } from './endpoints';
import { logout, setTokens } from '@/store/slices/authSlice';

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

// Response Interceptor: Global error handling with refresh token support
apiClient.interceptors.response.use(
  (response) => {
    // Return data natively where expected
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Standardize error message formats from the backend format `{ error: { message: ... } }`
    const customMessage = error.response?.data?.error?.message;
    if (customMessage) {
      error.message = customMessage;
    }

    // Attempt refresh token flow only for 401 + expired token, and only once per request
    if (
      error.response?.status === 401 &&
      customMessage === 'Token expired' &&
      store &&
      originalRequest &&
      !(originalRequest as any)._retry
    ) {
      (originalRequest as any)._retry = true;

      const state = store.getState() as RootState;
      const refreshToken = state.auth?.refreshToken;

      if (!refreshToken) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
        const { token: newAccessToken, refreshToken: newRefreshToken, user } = refreshResponse.data;

        store.dispatch(
          setTokens({
            token: newAccessToken,
            refreshToken: newRefreshToken,
            user: user ?? state.auth.user,
          })
        );

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
