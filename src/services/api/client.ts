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

// Response Interceptor: Unwrap success envelope and handle errors
apiClient.interceptors.response.use(
  (response) => {
    // Backend returns { success: true, statusCode, data, message?, meta? }; unwrap so callers get data
    const body = response.data;
    if (body && typeof body === 'object' && body.success === true && 'data' in body) {
      response.data = body.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Backend error format: { success: false, statusCode, error: { code, message, details? } }
    const customMessage = error.response?.data?.error?.message;
    if (customMessage) {
      error.message = customMessage;
    }

    // Attempt refresh token flow only for 401 + expired token, and only once per request
    if (
      error.response?.status === 401 &&
      (customMessage === 'Token expired' || error.response?.data?.error?.code === 'UNAUTHORIZED') &&
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
