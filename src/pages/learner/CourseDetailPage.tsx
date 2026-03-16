import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { courseService, progressService } from '@/services/api/course.service'
import { useToast } from '@/context/ToastContext'
import type { Course, CourseProgress } from '@/types/api'

const difficultyGradients: Record<string, string> = {
  beginner: 'from-emerald-600/90 to-teal-700/90',
  intermediate: 'from-sky-600/90 to-indigo-700/90',
  advanced: 'from-violet-600/90 to-fuchsia-700/90',
}

function normalizeProgress(raw: unknown): CourseProgress | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  return {
    id: String(o.id ?? o._id ?? ''),
    progress: Number(o.progress) || 0,
    completedLessonIds: Array.isArray(o.completedLessonIds)
      ? o.completedLessonIds.map((x) => String(x))
      : [],
    startedAt: (o.startedAt as string) ?? new Date().toISOString(),
    completedAt: o.completedAt as string | undefined,
    status: (o.status as CourseProgress['status']) ?? 'not_started',
    lastLessonId: o.lastLessonId != null ? String(o.lastLessonId) : undefined,
    lastAccessedAt: o.lastAccessedAt as string | undefined,
  }
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { addToast } = useToast()
  const [course, setCourse] = useState<Course | null>(null)
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [coverImgFailed, setCoverImgFailed] = useState(false)

  useEffect(() => {
    if (!id) return

    let cancelled = false
    setLoading(true)
    setLoadError(null)
    setProgress(null)

    async function load() {
      try {
        const courseId = id as string
        const courseData = await courseService.fetchCourse(courseId)
        if (cancelled) return
        setCourse(courseData)

        const progressData = await progressService.fetchCourseProgress(courseId).catch(() => null)
        if (!cancelled && progressData) {
          setProgress(normalizeProgress(progressData))
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load course')
          addToast('Failed to load course', 'error')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id, addToast])

  const handleEnroll = async () => {
    if (!id) return
    setEnrolling(true)
    try {
      await progressService.enrollInCourse(id)
      addToast('Enrolled successfully. The course is now in My Learning.', 'success')
      const progressData = await progressService.fetchCourseProgress(id)
      setProgress(normalizeProgress(progressData))
    } catch (err) {
      console.error(err)
      addToast('Failed to enroll. You may already be enrolled.', 'error')
    } finally {
      setEnrolling(false)
    }
  }

  const lessonStatus = useMemo(() => {
    if (!progress) return new Map<string, 'not_started' | 'in_progress' | 'completed'>()
    const map = new Map<string, 'not_started' | 'in_progress' | 'completed'>()
    const completedSet = new Set(progress.completedLessonIds.map(String))
    const lastId = progress.lastLessonId ? String(progress.lastLessonId) : null

    course?.lessons.forEach((lesson) => {
      const key = String(lesson._id)
      if (completedSet.has(key)) {
        map.set(key, 'completed')
      } else if (lastId && key === lastId) {
        map.set(key, 'in_progress')
      } else {
        map.set(key, 'not_started')
      }
    })

    return map
  }, [course, progress])

  const handleToggleLesson = async (lessonId: string) => {
    if (!id) return
    const current = lessonStatus.get(lessonId) ?? 'not_started'
    const nextStatus = current === 'completed' ? 'not_started' : 'completed'

    try {
      const updated = await progressService.updateLessonProgress(id, lessonId, nextStatus)
      setProgress(normalizeProgress(updated))
    } catch (err) {
      console.error(err)
      addToast('Failed to update progress', 'error')
    }
  }

  if (loading && !course) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <span className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <p className="text-sm text-slate-400">Loading course...</p>
      </div>
    )
  }

  if (loadError || !course) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-8 text-center">
        <p className="text-slate-100">{loadError ?? 'Course not found.'}</p>
      </div>
    )
  }

  const isEnrolled = progress !== null
  const gradient = difficultyGradients[course.difficulty] ?? 'from-slate-600/90 to-slate-700/90'
  const imageUrl = course.imageUrl?.trim()
  const showImage = imageUrl && !coverImgFailed

  return (
    <div className="space-y-6 pb-8">
      {/* Hero / cover */}
      <div className="overflow-hidden rounded-xl border border-slate-800 shadow-xl">
        <div className="relative aspect-[21/9] w-full bg-slate-800">
          {showImage ? (
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setCoverImgFailed(true)}
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-6xl font-bold text-white/20 select-none">
                {course.title.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-100 drop-shadow-sm sm:text-3xl">
                  {course.title}
                </h1>
                <p className="mt-1 line-clamp-2 text-sm text-slate-300">
                  {course.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-800/90 px-3 py-1 text-xs font-medium capitalize text-slate-200 backdrop-blur-sm">
                    {course.difficulty}
                  </span>
                  <span className="rounded-full bg-slate-700/90 px-3 py-1 text-xs text-slate-200 backdrop-blur-sm">
                    {course.category}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {!isEnrolled && (
                  <button
                    type="button"
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll in this course'}
                  </button>
                )}
                {isEnrolled && (
                  <span className="rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                    Enrolled
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isEnrolled && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Get full access</h3>
              <p className="mt-1 text-sm text-slate-400">
                Enroll to unlock all lessons and track your progress. This course will appear in My Learning.
              </p>
              {course.lessons.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  {course.lessons.length} lesson{course.lessons.length !== 1 ? 's' : ''} · Mark lessons as done as you go
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleEnroll}
              disabled={enrolling}
              className="shrink-0 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {enrolling ? 'Enrolling...' : 'Enroll now'}
            </button>
          </div>
        </section>
      )}

      {isEnrolled && (
        <>
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Your progress
              </h3>
              <span className="text-2xl font-bold text-sky-400">{progress!.progress}%</span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500"
                style={{ width: `${Math.min(100, progress!.progress)}%` }}
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Lessons
            </h3>
            <ul className="space-y-4">
              {course.lessons.map((lesson) => {
                const status = lessonStatus.get(String(lesson._id))
                const isCompleted = status === 'completed'
                return (
                  <li
                    key={lesson._id}
                    className={`rounded-lg border p-4 transition-colors ${
                      isCompleted
                        ? 'border-emerald-800/50 bg-emerald-950/20'
                        : 'border-slate-700/80 bg-slate-950/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                            isCompleted ? 'bg-emerald-900/50 text-emerald-300' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isCompleted ? '✓' : lesson.order}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-100">
                            {lesson.title}
                          </h4>
                          <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                            {lesson.content}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            status === 'completed'
                              ? 'bg-emerald-900/60 text-emerald-300'
                              : status === 'in_progress'
                                ? 'bg-sky-900/60 text-sky-300'
                                : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {status === 'completed' ? 'Done' : status === 'in_progress' ? 'In progress' : 'Not started'}
                        </span>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-sky-500 focus:ring-2 focus:ring-sky-500 focus:ring-offset-0 focus:ring-offset-slate-950"
                            checked={isCompleted}
                            onChange={() => handleToggleLesson(String(lesson._id))}
                          />
                          Mark done
                        </label>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
            {course.lessons.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">No lessons yet.</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}

