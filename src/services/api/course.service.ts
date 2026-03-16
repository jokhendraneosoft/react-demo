import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { Course, CourseFilters, CourseProgress, EnrollmentSummary } from '@/types/api';
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

  deleteCourse: async (id: string) => {
    await apiClient.delete(API_ENDPOINTS.COURSES.DETAILS(id));
  },

  toggleArchiveCourse: async (id: string) => {
    const res = await apiClient.post<Course>(API_ENDPOINTS.COURSES.ARCHIVE(id));
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
