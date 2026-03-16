export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    SEED_DEMO_USERS: '/auth/seed-demo-users',
    REFRESH: '/auth/refresh',
  },
  COURSES: {
    BASE: '/courses',
    DETAILS: (id: string) => `/courses/${id}`,
    ARCHIVE: (id: string) => `/courses/${id}/archive`,
    RECOMMENDATIONS: (id: string) => `/courses/${id}/recommendations`,
  },
  LEARNER: {
    SAVED_COURSES: '/learner/saved-courses',
    TOGGLE_SAVE: (id: string) => `/learner/saved-courses/${id}`,
    RECENT_COURSES: '/learner/recent-courses',
  },
  PROGRESS: {
    MY_COURSES: '/progress/learner/my-courses',
    COURSE_PROGRESS: (id: string) => `/progress/courses/${id}/progress`,
    ENROLL: (id: string) => `/progress/courses/${id}/enroll`,
    LESSON_PROGRESS: (courseId: string, lessonId: string) => `/progress/courses/${courseId}/lessons/${lessonId}/progress`,
  },
  ADMIN: {
    OVERVIEW_STATS: '/admin/stats/overview',
  },
} as const;
