export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/signup',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },
  LEARNER: {
    ROOT: '/learner',
    CATALOG: '/learner/catalog',
    COURSE_DETAIL: (id: string | ':id' = ':id') => `/learner/courses/${id}`,
    LESSON: (courseId: string | ':courseId' = ':courseId', lessonId: string | ':lessonId' = ':lessonId') =>
      `/learner/courses/${courseId}/lessons/${lessonId}`,
    MY_LEARNING: '/learner/my-learning',
    PROFILE: '/learner/profile',
  },
  ADMIN: {
    ROOT: '/admin',
    COURSES: '/admin/courses',
    COURSE_NEW: '/admin/courses/new',
    COURSE_EDIT: (id: string | ':id' = ':id') => `/admin/courses/${id}/edit`,
    STATS: '/admin/stats',
  },
} as const;

