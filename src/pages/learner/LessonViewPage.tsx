import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Circle,
  MessageSquare,
  FileText,
  ListChecks,
  Send,
  PanelRightClose,
  PanelRightOpen,
  Trophy,
  XCircle,
  MinusCircle,
  SkipForward,
  RotateCcw,
  CornerDownRight,
} from 'lucide-react'
import { courseService, progressService, quizService } from '@/services/api/course.service'
import { lessonCommentService } from '@/services/api/lessonComment.service'
import type { Course, Lesson, CourseProgress, LessonComment, LessonCommentReply } from '@/types/api'
import { useToast } from '@/context/ToastContext'
import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'
import { ErrorPanel } from '@/components/ui/ErrorPanel'

type SelectedAnswers = Record<string, string[]>
type QuizPhase = 'answering' | 'submitted'

interface ScoredQuestion {
  questionId: string
  isCorrect: boolean
  isSkipped: boolean
}

interface QuizScore {
  correct: number
  wrong: number
  skipped: number
  total: number
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
      if (videoId) return `https://www.youtube.com/embed/${videoId}`
    }
  } catch {
    return null
  }
  return null
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function ReplyItem({ reply }: { reply: LessonCommentReply }) {
  const isAdmin = reply.user?.role === 'admin'
  return (
    <div className="flex gap-2">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
          isAdmin
            ? 'bg-indigo-700/50 text-indigo-200 ring-1 ring-indigo-500/40'
            : 'bg-slate-700 text-slate-300'
        }`}
      >
        {getInitials(reply.user?.name ?? 'User')}
      </div>
      <div className="flex-1 rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2.5">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">
            {reply.user?.name ?? 'User'}
          </span>
          {isAdmin && (
            <span className="rounded-full bg-indigo-600/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-indigo-300">
              Admin
            </span>
          )}
          <span className="ml-auto text-[10px] text-slate-500">
            {new Date(reply.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">{reply.body}</p>
      </div>
    </div>
  )
}

function LessonViewPageInner({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? '')

  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [selected, setSelected] = useState<SelectedAnswers>({})
  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const [quizPhase, setQuizPhase] = useState<QuizPhase>('answering')
  const [score, setScore] = useState<QuizScore | null>(null)
  const [lastScore, setLastScore] = useState<QuizScore | null>(null)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [scoredQuestions, setScoredQuestions] = useState<ScoredQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'content' | 'summary' | 'quiz'>('content')
  const [comments, setComments] = useState<LessonComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  // reply state keyed by parent comment id
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({})
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({})
  const [rightPanelOpen, setRightPanelOpen] = useState(true)

  useEffect(() => {
    if (!courseId || !lessonId) return
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)

    async function load() {
      try {
        const cid = String(courseId)
        const data = await courseService.fetchCourse(cid, { signal: controller.signal })
        setCourse(data)
        const l = data.lessons.find((x) => String(x._id) === String(lessonId)) ?? null
        setLesson(l)

        const progressData = await progressService
          .fetchCourseProgress(cid, { signal: controller.signal })
          .catch((err) => {
            if (err.name !== 'CanceledError') return null
            throw err
          })
        if (progressData) setProgress(normalizeProgress(progressData))

        setCommentsLoading(true)
        lessonCommentService
          .fetchComments(cid, String(lessonId))
          .then((items) => setComments(items))
          .catch(console.error)
          .finally(() => setCommentsLoading(false))
      } catch (err: any) {
        if (err.name !== 'CanceledError') {
          setLoadError(err instanceof Error ? err.message : 'Failed to load lesson')
          addToast('Failed to load lesson', 'error')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [courseId, lessonId, addToast])

  const isCompleted = useMemo(() => {
    if (!progress || !lesson) return false
    return progress.completedLessonIds.map(String).includes(String(lesson._id))
  }, [progress, lesson])

  // On lesson change: restore quiz session from user-scoped localStorage,
  // then fetch the authoritative best score from the database.
  useEffect(() => {
    if (!userId) return

    // Restore full session from user-scoped localStorage
    const sessionKey = `quiz_${userId}_${courseId}_${lessonId}`
    let restoredFromStorage = false
    try {
      const raw = localStorage.getItem(sessionKey)
      if (raw) {
        const saved = JSON.parse(raw)
        setSelected(saved.selected ?? {})
        setSkipped(new Set(Array.isArray(saved.skipped) ? saved.skipped : []))
        setQuizPhase(saved.quizPhase === 'submitted' ? 'submitted' : 'answering')
        setScore(saved.score ?? null)
        setScoredQuestions(Array.isArray(saved.scoredQuestions) ? saved.scoredQuestions : [])
        setCurrentQuestionIndex(0)
        restoredFromStorage = true
      }
    } catch {
      localStorage.removeItem(sessionKey)
    }

    if (!restoredFromStorage) {
      setSelected({})
      setSkipped(new Set())
      setQuizPhase('answering')
      setScore(null)
      setScoredQuestions([])
      setCurrentQuestionIndex(0)
    }

    // Fetch authoritative summary from DB — works cross-device
    quizService
      .getSummary(courseId, lessonId)
      .then((summary) => {
        setTotalAttempts(summary.totalAttempts)
        if (summary.best) {
          const dbBest: QuizScore = {
            correct: summary.best.correct,
            wrong: summary.best.wrong,
            skipped: summary.best.skipped,
            total: summary.best.total,
          }
          setLastScore(dbBest)
          // No local session but DB has a record → show submitted state with DB score
          if (!restoredFromStorage && summary.attempted) {
            setScore(dbBest)
            setQuizPhase('submitted')
          }
        } else {
          setLastScore(null)
        }
      })
      .catch(() => {
        // DB unavailable — fallback to user-scoped localStorage best
        try {
          const raw = localStorage.getItem(`quiz_best_${userId}_${courseId}_${lessonId}`)
          setLastScore(raw ? (JSON.parse(raw) as QuizScore) : null)
        } catch {
          setLastScore(null)
        }
      })
  }, [userId, courseId, lessonId])

  const handleSelectOption = (questionId: string, optionId: string, type: 'single' | 'multiple') => {
    if (quizPhase === 'submitted') return
    // Selecting an answer removes the explicit skip for that question
    setSkipped((prev) => {
      const next = new Set(prev)
      next.delete(questionId)
      return next
    })
    setSelected((prev) => {
      const current = prev[questionId] ?? []
      if (type === 'single') return { ...prev, [questionId]: [optionId] }
      const set = new Set(current)
      if (set.has(optionId)) set.delete(optionId)
      else set.add(optionId)
      return { ...prev, [questionId]: Array.from(set) }
    })
  }

  const handleSkipQuestion = (questionId: string) => {
    if (quizPhase === 'submitted') return
    setSkipped((prev) => new Set([...prev, questionId]))
    // Clear any partial selection for this question
    setSelected((prev) => {
      const next = { ...prev }
      delete next[questionId]
      return next
    })
    // Auto-advance to next unanswered question if possible
    setCurrentQuestionIndex((idx) => {
      const quizLen = lesson?.quizQuestions?.length ?? 0
      return idx < quizLen - 1 ? idx + 1 : idx
    })
  }

  const handleSubmitQuiz = async () => {
    if (!lesson || !courseId || !lessonId || quizPhase === 'submitted') return
    const questions = lesson.quizQuestions ?? []
    if (!questions.length) return

    const results: ScoredQuestion[] = []
    let correct = 0
    let wrong = 0
    let skippedCount = 0

    questions.forEach((q) => {
      const selectedIds = new Set(selected[q.id] ?? [])
      const isExplicitlySkipped = skipped.has(q.id)
      const isUnanswered = selectedIds.size === 0

      if (isExplicitlySkipped || isUnanswered) {
        skippedCount++
        results.push({ questionId: q.id, isCorrect: false, isSkipped: true })
        return
      }

      const correctIds = new Set(q.correctOptionIds ?? [])
      let isCorrect = true
      q.options.forEach((opt) => {
        if (selectedIds.has(opt.id) !== correctIds.has(opt.id)) isCorrect = false
      })
      if (isCorrect && correctIds.size > 0) correct++
      else wrong++
      results.push({ questionId: q.id, isCorrect, isSkipped: false })
    })

    const finalScore: QuizScore = { correct, wrong, skipped: skippedCount, total: questions.length }

    setScore(finalScore)
    setScoredQuestions(results)
    setQuizPhase('submitted')
    setCurrentQuestionIndex(0)
    setLastScore((prev) => (!prev || finalScore.correct >= prev.correct ? finalScore : prev))
    setTotalAttempts((n) => n + 1)

    // Persist session under user-scoped localStorage key
    if (userId) {
      try {
        localStorage.setItem(
          `quiz_${userId}_${courseId}_${lessonId}`,
          JSON.stringify({
            quizPhase: 'submitted',
            selected,
            skipped: Array.from(skipped),
            score: finalScore,
            scoredQuestions: results,
          }),
        )
      } catch { /* non-fatal */ }

      // Update user-scoped best score (DB fallback for offline)
      try {
        const bestKey = `quiz_best_${userId}_${courseId}_${lessonId}`
        const existing = localStorage.getItem(bestKey)
        const prev: QuizScore | null = existing ? JSON.parse(existing) : null
        if (!prev || finalScore.correct >= prev.correct) {
          localStorage.setItem(bestKey, JSON.stringify(finalScore))
        }
      } catch { /* non-fatal */ }
    }

    // Save attempt to database — authoritative, cross-device record
    try {
      await quizService.submitAttempt(courseId, lessonId, {
        correct: finalScore.correct,
        wrong: finalScore.wrong,
        skipped: finalScore.skipped,
        total: finalScore.total,
        answers: results.map((r) => ({
          questionId: r.questionId,
          selectedOptionIds: selected[r.questionId] ?? [],
          isCorrect: r.isCorrect,
          isSkipped: r.isSkipped,
        })),
      })
    } catch (err) {
      console.error('Failed to save quiz attempt to server:', err)
      // Non-fatal — local data still saved
    }

    try {
      const updated = await progressService.updateLessonProgress(courseId, String(lessonId), 'completed')
      setProgress(normalizeProgress(updated))
      addToast('Quiz submitted and lesson marked complete', 'success')
    } catch (err) {
      console.error(err)
      addToast('Quiz submitted, but failed to update progress', 'error')
    }
  }

  const handleRetakeQuiz = () => {
    // Clear user-scoped session so retake starts fresh
    if (userId) {
      try { localStorage.removeItem(`quiz_${userId}_${courseId}_${lessonId}`) } catch { /* ignore */ }
    }
    setSelected({})
    setSkipped(new Set())
    setQuizPhase('answering')
    setScore(null)
    setScoredQuestions([])
    setCurrentQuestionIndex(0)
  }

  const handleSubmitComment = async () => {
    if (!courseId || !lessonId) return
    const body = commentInput.trim()
    if (!body || submittingComment) return
    setSubmittingComment(true)
    try {
      const created = await lessonCommentService.addComment(String(courseId), String(lessonId), body)
      setCommentInput('')
      setComments((prev) => [created, ...prev])
      addToast('Comment posted', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to post comment', 'error')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleSubmitReply = async (commentId: string) => {
    if (!courseId || !lessonId) return
    const body = (replyInputs[commentId] ?? '').trim()
    if (!body || submittingReply[commentId]) return
    setSubmittingReply((prev) => ({ ...prev, [commentId]: true }))
    try {
      const reply = await lessonCommentService.addReply(
        String(courseId),
        String(lessonId),
        commentId,
        body,
      )
      setReplyInputs((prev) => ({ ...prev, [commentId]: '' }))
      setReplyOpen((prev) => ({ ...prev, [commentId]: false }))
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c,
        ),
      )
      addToast('Reply posted', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to post reply', 'error')
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [commentId]: false }))
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading && !lesson) {
    return (
      <div className="-mx-6 -mt-6 flex min-h-screen">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-slate-800 bg-slate-950 px-6 py-4">
            <TextSkeleton className="mb-2 h-3 w-28" />
            <TextSkeleton className="h-5 w-64" />
            <TextSkeleton className="mt-1 h-3 w-44" />
          </div>
          <div className="space-y-6 px-6 py-6">
            <Skeleton className="aspect-video w-full rounded-xl border border-slate-800" />
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
              <div className="flex gap-4 border-b border-slate-800 pb-3">
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
              <TextSkeleton className="h-3 w-full" />
              <TextSkeleton className="h-3 w-5/6" />
              <TextSkeleton className="h-3 w-3/4" />
            </div>
          </div>
        </div>
        <div className="w-72 border-l border-slate-800 bg-slate-900 p-4 space-y-3">
          <TextSkeleton className="h-3 w-32" />
          <Skeleton className="h-2 w-full rounded-full" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────
  if (loadError || !course || !lesson) {
    return (
      <div className="space-y-4 pb-8">
        <Link
          to={courseId ? `/learner/courses/${courseId}` : '/learner/catalog'}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-sky-400"
        >
          <ArrowLeft size={14} /> Back to course
        </Link>
        <ErrorPanel title="Unable to load lesson" message={loadError ?? 'Lesson not found.'} />
      </div>
    )
  }

  // ── Derived values ────────────────────────────────────────────
  const embedUrl = getYouTubeEmbedUrl(lesson.videoUrl)
  const durationMinutes =
    typeof lesson.estimatedDurationMinutes === 'number' && lesson.estimatedDurationMinutes > 0
      ? lesson.estimatedDurationMinutes
      : 0
  const durationLabel =
    durationMinutes > 0
      ? durationMinutes >= 60
        ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 > 0 ? ` ${durationMinutes % 60}m` : ''}`
        : `${durationMinutes}m`
      : null

  const lessonStatusMap = (() => {
    const map = new Map<string, 'not_started' | 'in_progress' | 'completed'>()
    if (!progress) return map
    const completedSet = new Set(progress.completedLessonIds.map(String))
    const lastId = progress.lastLessonId ? String(progress.lastLessonId) : null
    course.lessons.forEach((l) => {
      const key = String(l._id)
      if (completedSet.has(key)) map.set(key, 'completed')
      else if (lastId && key === lastId) map.set(key, 'in_progress')
      else map.set(key, 'not_started')
    })
    return map
  })()

  const completedCount = [...lessonStatusMap.values()].filter((s) => s === 'completed').length
  const totalLessons = course.lessons.length
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  const currentLessonIndex = course.lessons.findIndex((l) => String(l._id) === String(lesson._id))
  const prevLessonId = currentLessonIndex > 0 ? String(course.lessons[currentLessonIndex - 1]._id) : null
  const nextLessonId =
    currentLessonIndex >= 0 && currentLessonIndex < course.lessons.length - 1
      ? String(course.lessons[currentLessonIndex + 1]._id)
      : null

  const quizQuestions = lesson.quizQuestions ?? []
  const tabs = [
    { id: 'content' as const, label: 'Content', icon: FileText },
    { id: 'summary' as const, label: 'Summary', icon: BookOpen },
    ...(quizQuestions.length > 0
      ? [{ id: 'quiz' as const, label: 'Quiz', icon: ListChecks, badge: quizQuestions.length }]
      : []),
  ]

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="-mx-6 -mt-6 flex min-h-screen">

      {/* ═══ Main content column ═══════════════════════════════ */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Sticky lesson header */}
        <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4 px-6 py-4">
            <div className="min-w-0 flex-1">
              <Link
                to={`/learner/courses/${course._id}`}
                className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-indigo-400"
              >
                <ArrowLeft size={13} />
                Back to course
              </Link>
              <h1 className="text-lg font-bold leading-snug text-slate-100 sm:text-xl">
                {lesson.title}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <BookOpen size={12} className="text-slate-500" />
                  {course.title}
                </span>
                {durationLabel && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-500" />
                    ~{durationLabel}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-slate-500">
                  Lesson {currentLessonIndex + 1} of {totalLessons}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isCompleted && (
                <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/25 sm:inline-flex">
                  <CheckCircle2 size={13} />
                  Completed
                </span>
              )}
              {/* Right panel toggle — shown in header for small screens & convenience */}
              <button
                type="button"
                title={rightPanelOpen ? 'Hide lessons panel' : 'Show lessons panel'}
                onClick={() => setRightPanelOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 transition-colors hover:border-indigo-500 hover:bg-indigo-600/20 hover:text-indigo-300"
              >
                {rightPanelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* Page body */}
        <div className="space-y-5 px-6 py-6 pb-10">

          {/* Video player */}
          {lesson.videoUrl && (
            <section className="overflow-hidden rounded-xl border border-slate-800 bg-black shadow-lg">
              {embedUrl ? (
                <div className="relative aspect-video w-full">
                  <iframe
                    src={embedUrl}
                    title={lesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                    <BookOpen size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Video lesson</p>
                    <a
                      href={lesson.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Open video ↗
                    </a>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Tabs — Content / Summary / Quiz */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
            {/* Tab bar */}
            <div className="flex border-b border-slate-800">
              {tabs.map(({ id, label, icon: Icon, badge }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`relative flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-medium transition-colors -mb-px ${
                    activeTab === id
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                  {badge !== undefined && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                      activeTab === id ? 'bg-indigo-600/30 text-indigo-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {activeTab === 'content' && (
                lesson.content ? (
                  <div
                    className="prose prose-invert prose-sm max-w-none text-slate-200"
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                  />
                ) : (
                  <p className="text-sm text-slate-500">No content available for this lesson.</p>
                )
              )}

              {activeTab === 'summary' && (
                lesson.summary ? (
                  <p className="text-sm leading-relaxed text-slate-300">{lesson.summary}</p>
                ) : (
                  <p className="text-sm text-slate-500">No summary provided for this lesson.</p>
                )
              )}

              {activeTab === 'quiz' && quizQuestions.length > 0 && isCompleted && quizPhase === 'answering' && (
                // Lesson already completed — show best score card from DB, then let user retake.
                <div className="space-y-4">
                  <div className={`rounded-xl border p-5 ${
                    lastScore && lastScore.correct === lastScore.total
                      ? 'border-emerald-600/40 bg-emerald-950/20'
                      : lastScore
                        ? 'border-amber-600/30 bg-amber-950/15'
                        : 'border-emerald-700/40 bg-emerald-950/20'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        lastScore && lastScore.correct === lastScore.total
                          ? 'bg-emerald-600/20'
                          : lastScore ? 'bg-amber-600/20' : 'bg-emerald-600/20'
                      }`}>
                        <Trophy size={20} className={
                          lastScore && lastScore.correct === lastScore.total
                            ? 'text-emerald-400'
                            : lastScore ? 'text-amber-400' : 'text-emerald-400'
                        } />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-100">Lesson completed</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {totalAttempts > 0
                            ? `${totalAttempts} attempt${totalAttempts !== 1 ? 's' : ''} recorded`
                            : 'Your quiz has been recorded.'}
                          {' '}You can retake anytime.
                        </p>
                      </div>
                      {lastScore && (
                        <div className="shrink-0 text-right">
                          <p className="text-2xl font-bold leading-none text-slate-100">
                            {lastScore.correct}
                            <span className="text-sm font-normal text-slate-400">/{lastScore.total}</span>
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            Best · {lastScore.total > 0 ? Math.round((lastScore.correct / lastScore.total) * 100) : 0}%
                          </p>
                        </div>
                      )}
                    </div>

                    {lastScore && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-emerald-900/30 px-3 py-2 text-center">
                          <p className="text-lg font-bold text-emerald-400">{lastScore.correct}</p>
                          <p className="text-[10px] text-slate-400">Correct</p>
                        </div>
                        <div className="rounded-lg bg-rose-900/30 px-3 py-2 text-center">
                          <p className="text-lg font-bold text-rose-400">{lastScore.wrong}</p>
                          <p className="text-[10px] text-slate-400">Wrong</p>
                        </div>
                        <div className="rounded-lg bg-slate-800/60 px-3 py-2 text-center">
                          <p className="text-lg font-bold text-slate-300">{lastScore.skipped}</p>
                          <p className="text-[10px] text-slate-400">Skipped</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleRetakeQuiz}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-700 hover:text-slate-100"
                  >
                    <RotateCcw size={14} />
                    Retake quiz
                  </button>
                </div>
              )}

              {activeTab === 'quiz' && quizQuestions.length > 0 && !(isCompleted && quizPhase === 'answering') && (() => {
                const q = quizQuestions[currentQuestionIndex]
                const selectedForQ = new Set(selected[q.id] ?? [])
                const isSkippedQ = skipped.has(q.id)
                const result = scoredQuestions.find((r) => r.questionId === q.id)
                const isSubmitted = quizPhase === 'submitted'

                return (
                  <div className="space-y-5">

                    {/* ── Score stats card (shown after submit) ── */}
                    {isSubmitted && score && (
                      <div className={`rounded-xl border p-5 ${
                        score.correct === score.total
                          ? 'border-emerald-600/40 bg-emerald-950/20'
                          : score.correct >= score.total / 2
                            ? 'border-amber-600/30 bg-amber-950/15'
                            : 'border-rose-700/40 bg-rose-950/15'
                      }`}>
                        <div className="mb-4 flex items-center gap-4">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                            score.correct === score.total ? 'bg-emerald-600/20' : 'bg-amber-600/15'
                          }`}>
                            <Trophy size={20} className={score.correct === score.total ? 'text-emerald-400' : 'text-amber-400'} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-100">
                              {score.correct === score.total
                                ? 'Perfect score!'
                                : score.correct >= score.total / 2
                                  ? 'Good effort!'
                                  : 'Keep studying!'}
                            </p>
                            <p className="text-xs text-slate-400">Quiz complete · Lesson marked as done</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold leading-none text-slate-100">
                              {score.correct}
                              <span className="text-sm font-normal text-slate-400">/{score.total}</span>
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                            </p>
                          </div>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex flex-col items-center gap-1 rounded-lg border border-emerald-700/30 bg-emerald-950/30 py-3">
                            <CheckCircle2 size={16} className="text-emerald-400" />
                            <span className="text-lg font-bold leading-none text-emerald-300">{score.correct}</span>
                            <span className="text-[10px] uppercase tracking-wider text-emerald-600">Correct</span>
                          </div>
                          <div className="flex flex-col items-center gap-1 rounded-lg border border-rose-800/30 bg-rose-950/20 py-3">
                            <XCircle size={16} className="text-rose-400" />
                            <span className="text-lg font-bold leading-none text-rose-300">{score.wrong}</span>
                            <span className="text-[10px] uppercase tracking-wider text-rose-600">Wrong</span>
                          </div>
                          <div className="flex flex-col items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/40 py-3">
                            <MinusCircle size={16} className="text-slate-400" />
                            <span className="text-lg font-bold leading-none text-slate-300">{score.skipped}</span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-500">Skipped</span>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={handleRetakeQuiz}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-700 hover:text-slate-100"
                          >
                            <RotateCcw size={12} />
                            Retake quiz
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Question dot indicators ── */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500 shrink-0">
                        {currentQuestionIndex + 1}/{quizQuestions.length}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {quizQuestions.map((dotQ, idx) => {
                          const dotResult = scoredQuestions.find((r) => r.questionId === dotQ.id)
                          const dotAnswered = (selected[dotQ.id] ?? []).length > 0
                          const dotSkipped = skipped.has(dotQ.id)
                          const isCurrent = idx === currentQuestionIndex

                          let bg = 'bg-slate-700 border-slate-600 text-slate-400'
                          if (isSubmitted) {
                            if (dotResult?.isSkipped) bg = 'bg-slate-700 border-slate-600 text-slate-400'
                            else if (dotResult?.isCorrect) bg = 'bg-emerald-600 border-emerald-500 text-white'
                            else bg = 'bg-rose-600 border-rose-500 text-white'
                          } else {
                            if (dotSkipped) bg = 'bg-amber-600/40 border-amber-500/60 text-amber-300'
                            else if (dotAnswered) bg = 'bg-indigo-600 border-indigo-500 text-white'
                          }

                          return (
                            <button
                              key={dotQ.id}
                              type="button"
                              title={`Question ${idx + 1}`}
                              onClick={() => setCurrentQuestionIndex(idx)}
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold transition-all ${bg} ${
                                isCurrent ? 'scale-125 ring-2 ring-white/40 ring-offset-1 ring-offset-slate-900' : 'hover:scale-110'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          )
                        })}
                      </div>
                      {!isSubmitted && (
                        <span className="ml-auto text-[10px] text-slate-500">
                          {Object.values(selected).filter((v) => v.length > 0).length} answered
                          {skipped.size > 0 && ` · ${skipped.size} skipped`}
                        </span>
                      )}
                    </div>

                    {/* ── Current question card ── */}
                    <div className={`rounded-xl border p-5 transition-colors ${
                      isSubmitted
                        ? result?.isSkipped
                          ? 'border-slate-700 bg-slate-900/60'
                          : result?.isCorrect
                            ? 'border-emerald-700/50 bg-emerald-950/20'
                            : 'border-rose-800/50 bg-rose-950/15'
                        : isSkippedQ
                          ? 'border-amber-700/40 bg-amber-950/10'
                          : 'border-slate-700 bg-slate-950/50'
                    }`}>
                      {/* Question header */}
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold leading-snug text-slate-100">
                          <span className="mr-2 text-slate-500">Q{currentQuestionIndex + 1}.</span>
                          {q.prompt || 'Untitled question'}
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                          {isSubmitted && (
                            result?.isSkipped ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                                <MinusCircle size={11} /> Skipped
                              </span>
                            ) : result?.isCorrect ? (
                              <CheckCircle2 size={17} className="text-emerald-400" />
                            ) : (
                              <XCircle size={17} className="text-rose-400" />
                            )
                          )}
                          {isSkippedQ && !isSubmitted && (
                            <span className="rounded-full bg-amber-600/20 px-2 py-0.5 text-[10px] font-medium text-amber-400 ring-1 ring-amber-500/30">
                              Skipped
                            </span>
                          )}
                          <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                            {q.type === 'single' ? 'Single' : 'Multi'}
                          </span>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const isSelected = selectedForQ.has(opt.id)
                          const isCorrectOpt = (q.correctOptionIds ?? []).includes(opt.id)
                          // Only reveal correct/wrong styling AFTER submit
                          const showCorrect = isSubmitted && isCorrectOpt
                          const showWrong = isSubmitted && isSelected && !isCorrectOpt

                          return (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                                isSubmitted ? 'cursor-default' : 'cursor-pointer'
                              } ${
                                showCorrect
                                  ? 'border-emerald-600/60 bg-emerald-950/40 text-emerald-200'
                                  : showWrong
                                    ? 'border-rose-700/60 bg-rose-950/40 text-rose-300'
                                    : isSelected
                                      ? 'border-indigo-500/60 bg-indigo-950/30 text-indigo-100'
                                      : isSubmitted
                                        ? 'border-slate-700/60 bg-slate-900/40 text-slate-400'
                                        : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500 hover:bg-slate-800/60'
                              }`}
                            >
                              <input
                                type={q.type === 'single' ? 'radio' : 'checkbox'}
                                className="h-4 w-4 shrink-0 accent-indigo-500"
                                name={`q-${q.id}`}
                                disabled={isSubmitted}
                                checked={isSelected}
                                onChange={() => handleSelectOption(q.id, opt.id, q.type)}
                              />
                              <span className="flex-1 leading-snug">{opt.text || 'Option'}</span>
                              {showCorrect && <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />}
                              {showWrong && <XCircle size={14} className="shrink-0 text-rose-400" />}
                            </label>
                          )
                        })}
                      </div>

                      {/* Correct answer hint for skipped questions (review mode) */}
                      {isSubmitted && result?.isSkipped && (
                        <p className="mt-3 text-xs text-slate-500 italic">
                          This question was skipped. Navigate to review the correct answer by selecting it above (locked).
                        </p>
                      )}
                    </div>

                    {/* ── Navigation + actions row ── */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Prev / Next */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={currentQuestionIndex === 0}
                          onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-800 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <ChevronLeft size={13} />
                          Prev
                        </button>
                        <button
                          type="button"
                          disabled={currentQuestionIndex === quizQuestions.length - 1}
                          onClick={() => setCurrentQuestionIndex((i) => Math.min(quizQuestions.length - 1, i + 1))}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-800 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          Next
                          <ChevronRight size={13} />
                        </button>
                      </div>

                      {/* Skip + Submit */}
                      <div className="flex items-center gap-2">
                        {!isSubmitted && (
                          <button
                            type="button"
                            onClick={() => handleSkipQuestion(q.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600/40 bg-amber-600/10 px-3 py-2 text-xs font-medium text-amber-400 transition-colors hover:border-amber-500/60 hover:bg-amber-600/20 hover:text-amber-300"
                          >
                            <SkipForward size={13} />
                            Skip
                          </button>
                        )}
                        {isSubmitted ? (
                          <span className="text-xs text-slate-500 italic">
                            Review mode — navigate questions above
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSubmitQuiz}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                          >
                            Submit quiz
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </section>

          {/* Comments */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-800 px-6 py-4">
              <MessageSquare size={15} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-100">Questions & discussion</h2>
              {comments.length > 0 && (
                <span className="ml-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                  {comments.length}
                </span>
              )}
            </div>
            <div className="p-6 space-y-4">
              {/* New comment input */}
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
                  You
                </div>
                <div className="flex-1 space-y-2">
                  <textarea
                    rows={2}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-colors resize-none"
                    placeholder="Ask a question or leave a note about this lesson…"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmitComment()
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-600">Ctrl+Enter to post</p>
                    <button
                      type="button"
                      onClick={handleSubmitComment}
                      disabled={submittingComment || !commentInput.trim()}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send size={12} />
                      {submittingComment ? 'Posting…' : 'Post comment'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Comment list */}
              {commentsLoading ? (
                <div className="space-y-3 pt-2">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <TextSkeleton className="h-3 w-24" />
                        <TextSkeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="pt-1 text-xs text-slate-500">
                  No comments yet — be the first to ask a question!
                </p>
              ) : (
                <div className="space-y-4 pt-2">
                  {comments.map((c) => {
                    const isReplyBoxOpen = replyOpen[c.id] ?? false
                    const replyText = replyInputs[c.id] ?? ''
                    const isSendingReply = submittingReply[c.id] ?? false

                    return (
                      <div key={c.id} className="space-y-2">
                        {/* Top-level comment */}
                        <div className="flex gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            c.user?.role === 'admin'
                              ? 'bg-indigo-700/50 text-indigo-200 ring-1 ring-indigo-500/40'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {getInitials(c.user?.name ?? 'Learner')}
                          </div>
                          <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
                            <div className="mb-1.5 flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-200">
                                {c.user?.name ?? 'Learner'}
                              </span>
                              {c.user?.role === 'admin' && (
                                <span className="rounded-full bg-indigo-600/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-indigo-300">
                                  Admin
                                </span>
                              )}
                              <span className="ml-auto text-[10px] text-slate-500">
                                {new Date(c.createdAt).toLocaleDateString(undefined, {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                })}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-300">{c.body}</p>
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setReplyOpen((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
                                }
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 transition-colors hover:text-indigo-400"
                              >
                                <CornerDownRight size={11} />
                                {isReplyBoxOpen ? 'Cancel' : `Reply${c.replies?.length ? ` · ${c.replies.length}` : ''}`}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Existing replies */}
                        {(c.replies?.length ?? 0) > 0 && !isReplyBoxOpen && (
                          <div className="ml-11 space-y-2">
                            {c.replies.map((r) => (
                              <ReplyItem key={r.id} reply={r} />
                            ))}
                          </div>
                        )}

                        {/* Reply input (shown when toggle is open) */}
                        {isReplyBoxOpen && (
                          <div className="ml-11 space-y-2">
                            {/* existing replies above the input */}
                            {c.replies?.map((r) => (
                              <ReplyItem key={r.id} reply={r} />
                            ))}
                            <div className="flex gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-[10px] font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
                                You
                              </div>
                              <div className="flex-1 space-y-1.5">
                                <textarea
                                  rows={2}
                                  autoFocus
                                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-colors resize-none"
                                  placeholder="Write a reply…"
                                  value={replyText}
                                  onChange={(e) =>
                                    setReplyInputs((prev) => ({ ...prev, [c.id]: e.target.value }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey))
                                      handleSubmitReply(c.id)
                                  }}
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <p className="text-[10px] text-slate-600">Ctrl+Enter to post</p>
                                  <button
                                    type="button"
                                    onClick={() => handleSubmitReply(c.id)}
                                    disabled={isSendingReply || !replyText.trim()}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Send size={11} />
                                    {isSendingReply ? 'Posting…' : 'Post reply'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-4">
            <button
              type="button"
              disabled={!prevLessonId}
              onClick={() => prevLessonId && navigate(`/learner/courses/${course._id}/lessons/${prevLessonId}`)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-800 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft size={15} />
              Previous
            </button>
            <span className="hidden text-xs text-slate-500 sm:block">
              {currentLessonIndex + 1} / {totalLessons}
            </span>
            <button
              type="button"
              disabled={!nextLessonId}
              onClick={() => nextLessonId && navigate(`/learner/courses/${course._id}/lessons/${nextLessonId}`)}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-600/40 bg-indigo-600/15 px-4 py-2 text-sm font-medium text-indigo-300 transition-colors hover:border-indigo-500 hover:bg-indigo-600/25 hover:text-indigo-200 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Right lessons panel ════════════════════════════════ */}
      <aside
        className={`relative border-l border-slate-800 bg-slate-900 transition-all duration-300 ease-in-out ${
          rightPanelOpen ? 'w-72 min-w-[18rem]' : 'w-0 min-w-0 overflow-hidden'
        }`}
      >
        {/* Sticky inner content */}
        <div className={`sticky top-0 flex h-screen flex-col overflow-hidden ${rightPanelOpen ? '' : 'hidden'}`}>
          {/* Panel header */}
          <div className="border-b border-slate-800 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Course lessons
            </p>
            <p className="mt-0.5 line-clamp-1 text-sm font-medium text-slate-200">{course.title}</p>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>{completedCount} of {totalLessons} completed</span>
                <span className="font-semibold text-indigo-400">{progressPct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Lesson list — scrollable */}
          <ol className="flex-1 overflow-y-auto p-3 space-y-1">
            {course.lessons.map((l, index) => {
              const idStr = String(l._id)
              const status = lessonStatusMap.get(idStr) ?? 'not_started'
              const isCurrent = String(lesson._id) === idStr
              return (
                <li key={idStr}>
                  <button
                    type="button"
                    onClick={() => navigate(`/learner/courses/${course._id}/lessons/${idStr}`)}
                    className={`group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isCurrent
                        ? 'bg-indigo-600/20 ring-1 ring-indigo-500/30'
                        : 'hover:bg-slate-800/70'
                    }`}
                  >
                    {/* Number badge */}
                    <span
                      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-semibold ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : status === 'completed'
                            ? 'bg-emerald-600/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {status === 'completed' && !isCurrent ? '✓' : index + 1}
                    </span>

                    {/* Title */}
                    <span
                      className={`flex-1 line-clamp-2 text-xs leading-snug ${
                        isCurrent ? 'text-indigo-200 font-medium' : 'text-slate-300 group-hover:text-slate-100'
                      }`}
                    >
                      {l.title}
                    </span>

                    {/* Status icon */}
                    <span className="mt-0.5 shrink-0">
                      {status === 'completed' ? (
                        <CheckCircle2 size={13} className="text-emerald-400" />
                      ) : status === 'in_progress' ? (
                        <CircleDot size={13} className="text-sky-400" />
                      ) : (
                        <Circle size={13} className="text-slate-700" />
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      </aside>
    </div>
  )
}

export default function LessonViewPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()

  if (!courseId || !lessonId) {
    return (
      <div className="space-y-4 pb-8">
        <p className="text-sm text-slate-400">Missing lesson information in the URL.</p>
        <Link to="/learner/catalog" className="inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300">
          <ArrowLeft size={14} /> Back to catalog
        </Link>
      </div>
    )
  }

  return <LessonViewPageInner courseId={courseId} lessonId={lessonId} />
}
