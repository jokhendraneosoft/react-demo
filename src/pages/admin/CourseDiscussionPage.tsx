import {
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { Link, useParams } from 'react-router-dom'
import { CornerDownRight, Send, MessageSquare } from 'lucide-react'
import { courseService } from '@/services/api/course.service'
import { lessonCommentService } from '@/services/api/lessonComment.service'
import type { Course, LessonComment, LessonCommentReply } from '@/types/api'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/routes/paths'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const MAX_REPLY_DEPTH = 3

function addReplyToTree(
  comments: LessonComment[],
  parentId: string,
  newReply: LessonCommentReply,
): LessonComment[] {
  return comments.map((c) => {
    if (c.id === parentId) {
      return { ...c, replies: [...(c.replies ?? []), newReply] }
    }
    if (c.replies?.length) {
      return {
        ...c,
        replies: addReplyToReplies(c.replies, parentId, newReply),
      }
    }
    return c
  })
}

function addReplyToReplies(
  replies: LessonCommentReply[],
  parentId: string,
  newReply: LessonCommentReply,
): LessonCommentReply[] {
  return replies.map((r) => {
    if (r.id === parentId) {
      return { ...r, replies: [...(r.replies ?? []), newReply] }
    }
    if (r.replies?.length) {
      return {
        ...r,
        replies: addReplyToReplies(r.replies, parentId, newReply),
      }
    }
    return r
  })
}

interface AdminReplyItemProps {
  reply: LessonCommentReply
  depth?: number
  replyOpen: Record<string, boolean>
  replyInputs: Record<string, string>
  submittingReply: Record<string, boolean>
  setReplyOpen: Dispatch<SetStateAction<Record<string, boolean>>>
  setReplyInputs: Dispatch<SetStateAction<Record<string, string>>>
  handleSubmitReply: (parentId: string) => void
}

function AdminReplyItem({
  reply,
  depth = 0,
  replyOpen,
  replyInputs,
  submittingReply,
  setReplyOpen,
  setReplyInputs,
  handleSubmitReply,
}: AdminReplyItemProps) {
  const isAdmin = reply.user?.role === 'admin'
  const isReplyOpen = replyOpen[reply.id] ?? false
  const replyText = replyInputs[reply.id] ?? ''
  const isSubmitting = submittingReply[reply.id] ?? false
  const nestedReplies = reply.replies ?? []
  const hasNested = nestedReplies.length > 0
  const underMaxDepth = depth < MAX_REPLY_DEPTH

  return (
    <div className="space-y-2">
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
          <div className="mt-2">
            <button
              type="button"
              onClick={() =>
                setReplyOpen((prev) => ({ ...prev, [reply.id]: !prev[reply.id] }))
              }
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 transition-colors hover:text-indigo-400"
            >
              <CornerDownRight size={11} />
              {isReplyOpen ? 'Cancel' : `Reply${hasNested ? ` · ${nestedReplies.length}` : ''}`}
            </button>
          </div>
        </div>
      </div>

      {hasNested && underMaxDepth && (
        <div className="ml-9 space-y-2">
          {nestedReplies.map((r) => (
            <AdminReplyItem
              key={r.id}
              reply={r}
              depth={depth + 1}
              replyOpen={replyOpen}
              replyInputs={replyInputs}
              submittingReply={submittingReply}
              setReplyOpen={setReplyOpen}
              setReplyInputs={setReplyInputs}
              handleSubmitReply={handleSubmitReply}
            />
          ))}
        </div>
      )}

      {isReplyOpen && (
        <div className="ml-9 flex gap-2">
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
                setReplyInputs((prev) => ({ ...prev, [reply.id]: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey))
                  handleSubmitReply(reply.id)
              }}
            />
            <div className="flex items-center justify-end gap-2">
              <p className="text-[10px] text-slate-600">Ctrl+Enter to post</p>
              <button
                type="button"
                onClick={() => handleSubmitReply(reply.id)}
                disabled={isSubmitting || !replyText.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={11} />
                {isSubmitting ? 'Posting…' : 'Post reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CourseDiscussionPage() {
  const { id: courseId } = useParams<{ id: string }>()
  const { addToast } = useToast()

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [comments, setComments] = useState<LessonComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({})
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!courseId) return
    setLoading(true)
    setError(null)
    courseService
      .fetchCourse(courseId)
      .then((data) => {
        setCourse(data)
        if (data.lessons?.length) {
          setSelectedLessonId(String(data.lessons[0]._id))
        } else {
          setSelectedLessonId(null)
        }
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to load course')
        addToast('Failed to load course', 'error')
      })
      .finally(() => setLoading(false))
  }, [courseId, addToast])

  useEffect(() => {
    if (!courseId || !selectedLessonId) {
      setComments([])
      return
    }
    setCommentsLoading(true)
    lessonCommentService
      .fetchComments(courseId, selectedLessonId)
      .then(setComments)
      .catch((err) => {
        console.error(err)
        setComments([])
        addToast('Failed to load comments', 'error')
      })
      .finally(() => setCommentsLoading(false))
  }, [courseId, selectedLessonId, addToast])

  const handleSubmitReply = useCallback(
    async (parentId: string) => {
      if (!courseId || !selectedLessonId) return
      const body = (replyInputs[parentId] ?? '').trim()
      if (!body || submittingReply[parentId]) return
      setSubmittingReply((prev) => ({ ...prev, [parentId]: true }))
      try {
        const reply = await lessonCommentService.addReply(
          courseId,
          selectedLessonId,
          parentId,
          body,
        )
        setReplyInputs((prev) => ({ ...prev, [parentId]: '' }))
        setReplyOpen((prev) => ({ ...prev, [parentId]: false }))
        setComments((prev) => addReplyToTree(prev, parentId, reply))
        addToast('Reply posted', 'success')
      } catch (err) {
        console.error(err)
        addToast('Failed to post reply', 'error')
      } finally {
        setSubmittingReply((prev) => ({ ...prev, [parentId]: false }))
      }
    },
    [courseId, selectedLessonId, replyInputs, submittingReply, addToast],
  )

  if (loading || !course) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          {loading ? 'Loading course…' : 'Course not found.'}
        </p>
        {!loading && courseId && (
          <Link to={ROUTES.ADMIN.COURSES} className="text-sm text-sky-400 hover:text-sky-300">
            Back to courses
          </Link>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-400">{error}</p>
        <Link to={ROUTES.ADMIN.COURSES} className="text-sm text-sky-400 hover:text-sky-300">
          Back to courses
        </Link>
      </div>
    )
  }

  const lessons = course.lessons ?? []
  const selectedLesson = lessons.find((l) => String(l._id) === selectedLessonId)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Discussion</h2>
          <p className="text-sm text-slate-400">{course.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.ADMIN.COURSE_EDIT(courseId!)}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            Edit course
          </Link>
          <Link
            to={ROUTES.ADMIN.COURSES}
            className="text-sm text-sky-400 hover:text-sky-300"
          >
            Back to courses
          </Link>
        </div>
      </header>

      {lessons.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm text-slate-400">This course has no lessons yet. Add lessons to see comments here.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Lesson
            </label>
            <select
              value={selectedLessonId ?? ''}
              onChange={(e) => setSelectedLessonId(e.target.value || null)}
              className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              {lessons.map((l, i) => (
                <option key={l._id} value={String(l._id)}>
                  {i + 1}. {l.title}
                </option>
              ))}
            </select>
          </div>

          <section className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-800 px-6 py-4">
              <MessageSquare size={15} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-100">
                Questions & discussion
                {selectedLesson && ` · ${selectedLesson.title}`}
              </h3>
              {comments.length > 0 && (
                <span className="ml-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                  {comments.length}
                </span>
              )}
            </div>
            <div className="p-6">
              {commentsLoading ? (
                <p className="text-sm text-slate-500">Loading comments…</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No comments yet for this lesson. Learners can ask questions on the lesson page.
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((c) => {
                    const isReplyOpen = replyOpen[c.id] ?? false
                    const replyText = replyInputs[c.id] ?? ''
                    const isSubmitting = submittingReply[c.id] ?? false
                    return (
                      <div key={c.id} className="space-y-2">
                        <div className="flex gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                              c.user?.role === 'admin'
                                ? 'bg-indigo-700/50 text-indigo-200 ring-1 ring-indigo-500/40'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
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
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
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
                                {isReplyOpen
                                  ? 'Cancel'
                                  : `Reply${c.replies?.length ? ` · ${c.replies.length}` : ''}`}
                              </button>
                            </div>
                          </div>
                        </div>

                        {(c.replies?.length ?? 0) > 0 && !isReplyOpen && (
                          <div className="ml-11 space-y-2">
                            {c.replies.map((r) => (
                              <AdminReplyItem
                                key={r.id}
                                reply={r}
                                replyOpen={replyOpen}
                                replyInputs={replyInputs}
                                submittingReply={submittingReply}
                                setReplyOpen={setReplyOpen}
                                setReplyInputs={setReplyInputs}
                                handleSubmitReply={handleSubmitReply}
                              />
                            ))}
                          </div>
                        )}

                        {isReplyOpen && (
                          <div className="ml-11 space-y-2">
                            {c.replies?.map((r) => (
                              <AdminReplyItem
                                key={r.id}
                                reply={r}
                                replyOpen={replyOpen}
                                replyInputs={replyInputs}
                                submittingReply={submittingReply}
                                setReplyOpen={setReplyOpen}
                                setReplyInputs={setReplyInputs}
                                handleSubmitReply={handleSubmitReply}
                              />
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
                                    disabled={isSubmitting || !replyText.trim()}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Send size={11} />
                                    {isSubmitting ? 'Posting…' : 'Post reply'}
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
        </>
      )}
    </div>
  )
}
