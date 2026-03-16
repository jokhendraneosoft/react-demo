import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { progressService } from '@/services/api/course.service'
import { useToast } from '@/context/ToastContext'
import type { EnrollmentSummary } from '@/types/api'

const difficultyGradients: Record<string, string> = {
  beginner: 'from-emerald-600/90 to-teal-700/90',
  intermediate: 'from-sky-600/90 to-indigo-700/90',
  advanced: 'from-violet-600/90 to-fuchsia-700/90',
}

function LearningCard({ enrollment }: { enrollment: EnrollmentSummary }) {
  const course = enrollment.course
  const gradient = course?.difficulty
    ? difficultyGradients[course.difficulty] ?? 'from-slate-600/90 to-slate-700/90'
    : 'from-slate-600/90 to-slate-700/90'
  const imageUrl = course?.imageUrl?.trim()
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = imageUrl && !imgFailed
  const isComplete = enrollment.progress >= 100
  const toUrl = course ? `/learner/courses/${course.id}` : '#'

  return (
    <Link
      to={toUrl}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-lg transition-all duration-200 hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-500/5 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-800">
        {showImage ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
          >
            <span className="text-4xl font-bold text-white/20 select-none">
              {course?.title?.charAt(0) ?? '?'}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {course && (
              <>
                <span className="rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/90 backdrop-blur-sm">
                  {course.category}
                </span>
                <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-medium capitalize text-white backdrop-blur-sm">
                  {course.difficulty}
                </span>
              </>
            )}
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${
              isComplete
                ? 'bg-emerald-500/90 text-white'
                : 'bg-sky-500/90 text-white'
            }`}
          >
            {enrollment.progress}%
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 line-clamp-2 text-base font-semibold text-slate-100 transition-colors group-hover:text-sky-200">
          {course?.title ?? 'Unknown course'}
        </h3>
        <p className="mb-3 text-xs text-slate-500">
          Started {new Date(enrollment.startedAt).toLocaleDateString()}
        </p>
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500"
            style={{ width: `${Math.min(100, enrollment.progress)}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">
            {isComplete ? 'Completed' : 'In progress'}
          </span>
          <span className="text-xs font-medium text-sky-400 group-hover:text-sky-300">
            {isComplete ? 'Review course' : 'Continue'} →
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function MyLearningPage() {
  const { addToast } = useToast()
  const [enrollments, setEnrollments] = useState<EnrollmentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    progressService.fetchMyCourses()
      .then((data) => setEnrollments(data))
      .catch((err) => {
        console.error(err)
        setError('Failed to load your courses')
        addToast('Failed to load your courses', 'error')
      })
      .finally(() => setLoading(false))
  }, [addToast])

  const overallProgress = useMemo(() => {
    if (enrollments.length === 0) return 0
    const total = enrollments.reduce((sum, e) => sum + e.progress, 0)
    return Math.round(total / enrollments.length)
  }, [enrollments])

  const mostRecent = useMemo(() => {
    if (enrollments.length === 0) return null
    return [...enrollments].sort((a, b) => {
      const aDate = new Date(a.lastAccessedAt ?? a.startedAt).getTime()
      const bDate = new Date(b.lastAccessedAt ?? b.startedAt).getTime()
      return bDate - aDate
    })[0]
  }, [enrollments])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        Loading your courses...
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-red-400">{error}</p>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">My Learning</h2>
          <p className="text-sm text-slate-400">Track your active and completed courses.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-center shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Average progress
            </p>
            <p className="text-2xl font-bold text-sky-400">{overallProgress}%</p>
          </div>
          {enrollments.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-center shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Enrolled
              </p>
              <p className="text-2xl font-bold text-slate-200">{enrollments.length}</p>
            </div>
          )}
        </div>
      </header>

      {mostRecent && mostRecent.course && (
        <section className="overflow-hidden rounded-xl border border-sky-700/50 bg-gradient-to-br from-sky-950/60 to-slate-900 p-4 shadow-lg">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-sky-400">
            Continue where you left off
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-slate-100">{mostRecent.course.title}</h3>
              <p className="mt-1 text-sm text-slate-400">
                {mostRecent.progress}% complete · {mostRecent.course.category} ·{' '}
                {mostRecent.course.difficulty}
              </p>
            </div>
            <Link
              to={`/learner/courses/${mostRecent.course.id}${
                mostRecent.lastLessonId ? `?lesson=${mostRecent.lastLessonId}` : ''
              }`}
              className="shrink-0 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Continue course
            </Link>
          </div>
        </section>
      )}

      <div>
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">
          All your courses
        </h3>
        {enrollments.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <p className="text-slate-400">You haven&apos;t enrolled in any courses yet.</p>
            <Link
              to="/learner/catalog"
              className="mt-3 inline-block text-sm font-medium text-sky-400 hover:text-sky-300"
            >
              Browse catalog →
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {enrollments.map((enrollment) => (
              <LearningCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

