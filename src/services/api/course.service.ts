import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type {
  Course,
  CourseFilters,
  CourseProgress,
  EnrollmentSummary,
  RecentCourseSummary,
  SavedCourseSummary,
  QuizAttemptResult,
  QuizAnswer,
  QuizSummary,
} from '@/types/api';
import type { AxiosRequestConfig } from 'axios';

export const courseService = {
  fetchCourses: async (filters: CourseFilters = {}, config?: AxiosRequestConfig) => {
    const params: Record<string, string> = {};

    if (filters.q) params.q = filters.q;
    if (filters.category) params.category = filters.category;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (filters.status && filters.status !== 'all') params.status = filters.status;

    const res = await apiClient.get<Course[]>(API_ENDPOINTS.COURSES.BASE, { params, ...config });
    return res.data;
  },

  fetchCourse: async (id: string, config?: AxiosRequestConfig) => {
    const res = await apiClient.get<Course>(API_ENDPOINTS.COURSES.DETAILS(id), config);
    return res.data;
  },

  fetchRecommendations: async (id: string) => {
    const res = await apiClient.get<
      {
        id: string;
        title: string;
        description: string;
        category: string;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        imageUrl?: string;
        estimatedDurationMinutes?: number;
      }[]
    >(API_ENDPOINTS.COURSES.RECOMMENDATIONS(id));
    return res.data;
  },

  deleteCourse: async (id: string) => {
    await apiClient.delete(API_ENDPOINTS.COURSES.DETAILS(id));
  },

  toggleArchiveCourse: async (id: string) => {
    const res = await apiClient.post<Course>(API_ENDPOINTS.COURSES.ARCHIVE(id));
    return res.data;
  },

  fetchSavedCourses: async () => {
    const res = await apiClient.get<SavedCourseSummary[]>(API_ENDPOINTS.LEARNER.SAVED_COURSES);
    return res.data;
  },

  toggleSavedCourse: async (id: string) => {
    const res = await apiClient.post<{ saved: boolean; savedCourseIds: string[] }>(
      API_ENDPOINTS.LEARNER.TOGGLE_SAVE(id)
    );
    return res.data;
  },

  fetchRecentCourses: async () => {
    const res = await apiClient.get<RecentCourseSummary[]>(API_ENDPOINTS.LEARNER.RECENT_COURSES);
    return res.data;
  },
};

export const progressService = {
  fetchMyCourses: async () => {
    const res = await apiClient.get<EnrollmentSummary[]>(API_ENDPOINTS.PROGRESS.MY_COURSES);
    return res.data;
  },

  fetchCourseProgress: async (id: string, config?: AxiosRequestConfig) => {
    const res = await apiClient.get<CourseProgress>(API_ENDPOINTS.PROGRESS.COURSE_PROGRESS(id), config);
    return res.data;
  },

  enrollInCourse: async (id: string) => {
    const res = await apiClient.post(API_ENDPOINTS.PROGRESS.ENROLL(id));
    return res.data;
  },

  updateLessonProgress: async (
    courseId: string,
    lessonId: string,
    status: 'not_started' | 'in_progress' | 'completed'
  ) => {
    const res = await apiClient.post<CourseProgress>(
      API_ENDPOINTS.PROGRESS.LESSON_PROGRESS(courseId, lessonId),
      { status }
    );
    return res.data;
  },
};

export interface QuizSubmitPayload {
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  answers: QuizAnswer[];
}

export const quizService = {
  /** Save a completed quiz attempt to the database (user-scoped). */
  submitAttempt: async (
    courseId: string,
    lessonId: string,
    payload: QuizSubmitPayload
  ): Promise<QuizAttemptResult> => {
    const res = await apiClient.post<QuizAttemptResult>(
      API_ENDPOINTS.PROGRESS.QUIZ_SUBMIT(courseId, lessonId),
      payload
    );
    return res.data;
  },

  /** Fetch the learner's quiz summary (best + latest attempt) from the database. */
  getSummary: async (courseId: string, lessonId: string): Promise<QuizSummary> => {
    const res = await apiClient.get<QuizSummary>(
      API_ENDPOINTS.PROGRESS.QUIZ_SUMMARY(courseId, lessonId)
    );
    return res.data;
  },
};
