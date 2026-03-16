import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { courseService, progressService } from '@/services/api/course.service'
import type { Course, Lesson, CourseProgress } from '@/types/api'
import { useToast } from '@/context/ToastContext'

type SelectedAnswers = Record<string, string[]> // questionId -> optionIds

interface ScoredQuestion {
  questionId: string
  isCorrect: boolean
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

function getYouTubeEmbedUrl(url: string | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const videoId = u.searchParams.get('v') || u.pathname.replace('/', '')
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }
    }
  } catch {
    return null
  }
  return null
}

export default function LessonViewPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const { addToast } = useToast()
  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [selected, setSelected] = useState<SelectedAnswers>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null)
  const [scoredQuestions, setScoredQuestions] = useState<ScoredQuestion[]>([])
  const [activeTab, setActiveTab] = useState<'content' | 'summary' | 'quiz'>('content')

  useEffect(() => {
    if (!courseId || !lessonId) return
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)

    async function load() {
      try {
        const data = await courseService.fetchCourse(courseId, { signal: controller.signal })
        setCourse(data)
        const l = data.lessons.find((x) => String(x._id) === String(lessonId)) ?? null
        setLesson(l)

        const progressData = await progressService
          .fetchCourseProgress(courseId, { signal: controller.signal })
          .catch((err) => {
            if (err.name !== 'CanceledError') return null
            throw err
          })
        if (progressData) {
          setProgress(normalizeProgress(progressData))
        }
      } catch (err: any) {
        if (err.name !== 'CanceledError') {
          setLoadError(err instanceof Error ? err.message : 'Failed to load lesson')
          addToast('Failed to load lesson', 'error')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    load()
    return () => controller.abort()
  }, [courseId, lessonId, addToast])

  const isCompleted = useMemo(() => {
    if (!progress || !lesson) return false
    return progress.completedLessonIds.map(String).includes(String(lesson._id))
  }, [progress, lesson])

  const handleSelectOption = (questionId: string, optionId: string, type: 'single' | 'multiple') => {
    setSelected((prev) => {
      const current = prev[questionId] ?? []
      if (type === 'single') {
        return { ...prev, [questionId]: [optionId] }
      }
      const set = new Set(current)
      if (set.has(optionId)) set.delete(optionId)
      else set.add(optionId)
      return { ...prev, [questionId]: Array.from(set) }
    })
  }

  const handleSubmitQuiz = async () => {
    if (!lesson || !courseId || !lessonId) return
    const questions = lesson.quizQuestions ?? []
    if (!questions.length) return

    const results: ScoredQuestion[] = []
    let correct = 0

    questions.forEach((q) => {
      const selectedIds = new Set(selected[q.id] ?? [])
      const correctIds = new Set(q.correctOptionIds ?? [])
      let isCorrect = true
      q.options.forEach((opt) => {
        const s = selectedIds.has(opt.id)
        const c = correctIds.has(opt.id)
        if (s !== c) {
          isCorrect = false
        }
      })
      if (isCorrect && correctIds.size > 0) {
        correct += 1
      }
      results.push({ questionId: q.id, isCorrect })
    })

    setScore({ correct, total: questions.length })
    setScoredQuestions(results)
    setSubmitted(true)

    try {
      const updated = await progressService.updateLessonProgress(courseId, String(lessonId), 'completed')
      setProgress(normalizeProgress(updated))
      addToast('Quiz submitted and lesson marked complete', 'success')
    } catch (err) {
      console.error(err)
      addToast('Quiz submitted, but failed to update progress', 'error')
    }
  }

  if (loading && !lesson) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <span className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <p className="text-sm text-slate-400">Loading lesson...</p>
      </div>
    )
  }

  if (loadError || !course || !lesson) {
    return (
      <div className="space-y-4 pb-8">
        <Link
          to={courseId ? `/learner/courses/${courseId}` : '/learner/catalog'}
          className="text-sm text-sky-400 hover:text-sky-300"
        >
          ← Back to course
        </Link>
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-8 text-center">
          <p className="text-slate-100">{loadError ?? 'Lesson not found.'}</p>
        </div>
      </div>
    )
  }

  const embedUrl = getYouTubeEmbedUrl(lesson.videoUrl)

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            to={`/learner/courses/${course._id}`}
            className="text-xs text-sky-400 hover:text-sky-300"
          >
            ← Back to course
          </Link>
          <h1 className="text-xl font-semibold text-slate-100">{lesson.title}</h1>
          <p className="text-xs text-slate-400">{course.title}</p>
        </div>
        {isCompleted && (
          <span className="rounded-full bg-emerald-500/20 px-4 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
            Lesson completed
          </span>
        )}
      </div>

      {lesson.videoUrl && (
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          {embedUrl ? (
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={embedUrl}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          ) : (
            <div className="p-4 text-sm text-slate-300">
              <p>This lesson includes a video:</p>
              <a
                href={lesson.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sky-400 hover:text-sky-300"
              >
                Open video
              </a>
            </div>
          )}
        </section>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
        <div className="mb-4 flex gap-2 border-b border-slate-800 pb-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`rounded px-3 py-1 ${
              activeTab === 'content'
                ? 'bg-slate-800 text-sky-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Content
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`rounded px-3 py-1 ${
              activeTab === 'summary'
                ? 'bg-slate-800 text-sky-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Summary
          </button>
          {(lesson.quizQuestions ?? []).length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className={`rounded px-3 py-1 ${
                activeTab === 'quiz'
                  ? 'bg-slate-800 text-sky-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Quiz
            </button>
          )}
        </div>

        {activeTab === 'summary' && (
          <div>
            {lesson.summary ? (
              <p className="text-sm text-slate-300">{lesson.summary}</p>
            ) : (
              <p className="text-sm text-slate-500">No summary provided for this lesson.</p>
            )}
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            {lesson.content ? (
              <div
                className="prose prose-invert prose-sm max-w-none text-slate-100"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            ) : (
              <p className="text-sm text-slate-500">No content available for this lesson.</p>
            )}
          </div>
        )}

        {activeTab === 'quiz' && (lesson.quizQuestions ?? []).length > 0 && (
          <div className="mt-2 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">Check your understanding</h2>
                <p className="text-xs text-slate-400">
                  Answer the questions below, then submit to see your score.
                </p>
              </div>
              {score && (
                <span className="rounded-full bg-sky-600/20 px-3 py-1 text-xs font-semibold text-sky-300">
                  You scored {score.correct}/{score.total}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {(lesson.quizQuestions ?? []).map((q) => {
                const selectedForQ = new Set(selected[q.id] ?? [])
                const result = scoredQuestions.find((r) => r.questionId === q.id)
                const wasCorrect = result?.isCorrect

                return (
                  <div
                    key={q.id}
                    className={`rounded-lg border p-4 text-sm ${
                      submitted
                        ? wasCorrect
                          ? 'border-emerald-700/70 bg-emerald-950/30'
                          : 'border-rose-800/70 bg-rose-950/20'
                        : 'border-slate-700 bg-slate-950/80'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-100">
                        {q.prompt || 'Untitled question'}
                      </p>
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                        {q.type === 'single' ? 'Single choice' : 'Multiple choice'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const isSelected = selectedForQ.has(opt.id)
                        const isCorrect = (q.correctOptionIds ?? []).includes(opt.id)
                        const showCorrect = submitted && isCorrect
                        const showWrong = submitted && isSelected && !isCorrect

                        return (
                          <label
                            key={opt.id}
                            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                              showCorrect
                                ? 'border-emerald-600 bg-emerald-950/40 text-emerald-200'
                                : showWrong
                                  ? 'border-rose-700 bg-rose-950/40 text-rose-200'
                                  : isSelected
                                    ? 'border-sky-600 bg-sky-950/30 text-sky-100'
                                    : 'border-slate-700 bg-slate-900/80 text-slate-100 hover:border-slate-500'
                            }`}
                          >
                            <input
                              type={q.type === 'single' ? 'radio' : 'checkbox'}
                              className="h-3.5 w-3.5 rounded border-slate-500 bg-slate-950 text-sky-500"
                              name={q.id}
                              disabled={submitted}
                              checked={isSelected}
                              onChange={() => handleSelectOption(q.id, opt.id, q.type)}
                            />
                            <span className="flex-1">{opt.text || 'Option'}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              {submitted && (
                <span className="text-xs text-slate-400">
                  Quiz locked. You can review which answers were correct.
                </span>
              )}
              <button
                type="button"
                disabled={submitted || !(lesson.quizQuestions ?? []).length}
                onClick={handleSubmitQuiz}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitted ? 'Submitted' : 'Submit quiz'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

