export interface Lesson {
  _id: string
  title: string
  content: string
  order: number
}

export interface Course {
  _id: string
  title: string
  description: string
  category: string
  imageUrl?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags?: string[]
  estimatedDurationMinutes?: number
  lessons: Lesson[]
  published: boolean
  archived?: boolean
}

export interface EnrollmentSummary {
  id: string
  progress: number
  completedLessonIds: string[]
  startedAt: string
  completedAt?: string
  status: 'not_started' | 'in_progress' | 'completed'
  lastLessonId?: string
  lastAccessedAt?: string
  course: {
    id: string
    title: string
    description: string
    category: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    imageUrl?: string
  } | null
}

export interface CourseProgress {
  id: string
  progress: number
  completedLessonIds: string[]
  startedAt: string
  completedAt?: string
  status: 'not_started' | 'in_progress' | 'completed'
  lastLessonId?: string
  lastAccessedAt?: string
}

export interface AdminOverviewStats {
  courseCount: number
  enrollmentsPerCourse: { _id: string; enrollments: number }[]
  ratingsPerCourse: { _id: string; averageRating: number; count: number }[]
  activeLearners: number
  completionPerCourse: { _id: string; completed: number; total: number }[]
}

export interface CourseFilters {
  q?: string
  category?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | ''
  status?: 'published' | 'draft' | 'all'
}

