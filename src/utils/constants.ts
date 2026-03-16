export const ROLES = {
  LEARNER: 'learner',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const STORAGE_KEYS = {
  AUTH: 'learning-tracker-auth',
  THEME: 'learning-tracker-theme',
} as const;

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
