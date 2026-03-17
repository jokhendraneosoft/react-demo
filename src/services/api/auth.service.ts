import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { AuthUser } from '@/store/slices/authSlice';

// We inline the credentials types here or use a shared one
interface LoginCredentials {
  email: string;
  password?: string;
}

interface SignupCredentials extends LoginCredentials {
  name: string;
  role: 'learner' | 'admin';
}

interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

interface ForgotPasswordPayload {
  email: string;
}

interface ResetPasswordPayload {
  email: string;
  token?: string;
  password: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const res = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return res.data;
  },

  signup: async (credentials: SignupCredentials) => {
    const res = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, credentials);
    return res.data;
  },

  refresh: async (refreshToken: string) => {
    const res = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
    return res.data;
  },

  forgotPassword: async (payload: ForgotPasswordPayload) => {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, payload);
    return res.data;
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload);
    return res.data;
  },

  seedDemoUsers: async () => {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.SEED_DEMO_USERS);
    return res.data;
  },
};
