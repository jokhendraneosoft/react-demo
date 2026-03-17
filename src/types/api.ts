export type LessonQuizType = 'single' | 'multiple'

export interface LessonQuizOption {
  id: string
  text: string
}

export interface LessonQuizQuestion {
  id: string
  prompt: string
  type: LessonQuizType
  options: LessonQuizOption[]
  correctOptionIds: string[]
}

export interface Lesson {
  _id: string
  title: string
  content: string
  order: number
  summary?: string
  videoUrl?: string
  estimatedDurationMinutes?: number
  quizQuestions?: LessonQuizQuestion[]
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

export interface AdminCourseStatBase {
  courseId: string
  courseTitle: string
  category: string
}

export interface AdminEnrollmentsPerCourse extends AdminCourseStatBase {
  enrollments: number
}

export interface AdminRatingsPerCourse extends AdminCourseStatBase {
  averageRating: number
  count: number
}

export interface AdminCompletionPerCourse extends AdminCourseStatBase {
  completed: number
  total: number
}

export interface AdminEnrollmentPoint {
  date: string
  count: number
}

export type AdminStatsRange = '7d' | '30d' | 'all'

export interface AdminOverviewStats {
  courseCount: number
  enrollmentsPerCourse: AdminEnrollmentsPerCourse[]
  ratingsPerCourse: AdminRatingsPerCourse[]
  activeLearners: number
  completionPerCourse: AdminCompletionPerCourse[]
  enrollmentsTimeSeries: AdminEnrollmentPoint[]
  range: AdminStatsRange
}

export interface CourseFilters {
  q?: string
  category?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | ''
  status?: 'published' | 'draft' | 'all'
}

export interface SavedCourseSummary {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  imageUrl?: string
  estimatedDurationMinutes?: number
}

export interface RecentCourseSummary extends SavedCourseSummary {
  lastViewedAt: string
}

export interface CourseRatingSummary {
  average: number
  count: number
}

export interface CourseWithRating extends Course {
  rating?: CourseRatingSummary
}

export interface CourseFeedback {
  id: string
  rating: number
  comment: string
  user: {
    id: string
    name: string
  } | null
  createdAt: string
}

export interface LessonCommentUser {
  id: string
  name: string
  /** 'admin' | 'learner' — used to badge admin/instructor replies */
  role: string
}

export interface LessonCommentReply {
  id: string
  body: string
  createdAt: string
  parentId: string
  user: LessonCommentUser | null
}

export interface LessonComment {
  id: string
  body: string
  createdAt: string
  parentId: string | null
  user: LessonCommentUser | null
  replies: LessonCommentReply[]
}

export interface QuizAnswer {
  questionId: string
  selectedOptionIds: string[]
  isCorrect: boolean
  isSkipped: boolean
}

export interface QuizAttemptResult {
  id: string
  attemptNumber: number
  correct: number
  wrong: number
  skipped: number
  total: number
  percentage: number
  answers: QuizAnswer[]
  submittedAt: string
}

export interface QuizSummary {
  attempted: boolean
  totalAttempts: number
  best: QuizAttemptResult | null
  latest: QuizAttemptResult | null
}

