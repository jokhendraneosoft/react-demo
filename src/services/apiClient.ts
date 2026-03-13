import axios from 'axios'
import type { RootState } from '@/store'
import { store } from '@/store'
import type {
  AdminOverviewStats,
  Course,
  CourseFilters,
  CourseProgress,
  EnrollmentSummary,
} from '@/types/api'

export const apiClient = axios.create({
  baseURL: 'http://localhost:4000/api',
})

apiClient.interceptors.request.use((config) => {
  const state: RootState = store.getState()
  const token = state.auth.token

  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export async function fetchCourses(filters: CourseFilters = {}) {
  const params: Record<string, string> = {}

  if (filters.q) params.q = filters.q
  if (filters.category) params.category = filters.category
  if (filters.difficulty) params.difficulty = filters.difficulty
  if (filters.status && filters.status !== 'all') params.status = filters.status

  const res = await apiClient.get<Course[]>('/courses', { params })
  return res.data
}

export async function fetchCourse(id: string) {
  const res = await apiClient.get<Course>(`/courses/${id}`)
  return res.data
}

export async function fetchMyCourses() {
  const res = await apiClient.get<EnrollmentSummary[]>('/progress/learner/my-courses')
  return res.data
}

export async function fetchCourseProgress(id: string) {
  const res = await apiClient.get<CourseProgress>(`/progress/courses/${id}/progress`)
  return res.data
}

export async function enrollInCourse(id: string) {
  const res = await apiClient.post(`/progress/courses/${id}/enroll`)
  return res.data
}

export async function updateLessonProgress(
  courseId: string,
  lessonId: string,
  status: 'not_started' | 'in_progress' | 'completed',
) {
  const res = await apiClient.post<CourseProgress>(
    `/progress/courses/${courseId}/lessons/${lessonId}/progress`,
    { status },
  )
  return res.data
}

export async function deleteCourse(id: string) {
  await apiClient.delete(`/courses/${id}`)
}

export async function toggleArchiveCourse(id: string) {
  const res = await apiClient.post<Course>(`/courses/${id}/archive`)
  return res.data
}

export async function fetchAdminOverviewStats() {
  const res = await apiClient.get<AdminOverviewStats>('/admin/stats/overview')
  return res.data
}

