import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Plus,
  Archive,
  ArchiveRestore,
  Pencil,
  MessageSquare,
  Trash2,
  Layers,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { courseService } from '@/services/api/course.service'
import { ROUTES } from '@/routes/paths'
import type { Course } from '@/types/api'
import { getAllLessons } from '@/types/api'
import { useToast } from '@/context/ToastContext'

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export default function CourseListPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    setLoading(true)
    courseService
      .fetchCourses({ status: 'all' })
      .then((data) => setCourses(data))
      .catch((err) => {
        console.error(err)
        addToast('Failed to load courses', 'error')
      })
      .finally(() => setLoading(false))
  }, [addToast])

  const visibleCourses = useMemo(
    () => courses.filter((c) => (showArchived ? true : !c.archived)),
    [courses, showArchived],
  )

  const stats = useMemo(
    () => ({
      total: courses.filter((c) => !c.archived).length,
      published: courses.filter((c) => !c.archived && c.published).length,
      draft: courses.filter((c) => !c.archived && !c.published).length,
      archived: courses.filter((c) => c.archived).length,
    }),
    [courses],
  )

  const handleRequestDelete = useCallback((id: string) => {
    setPendingDeleteId(id)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return
    try {
      await courseService.deleteCourse(pendingDeleteId)
      setCourses((prev) => prev.filter((c) => c._id !== pendingDeleteId))
      setPendingDeleteId(null)
      addToast('Course deleted', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to delete course', 'error')
    }
  }, [pendingDeleteId, addToast])

  const handleCancelDelete = useCallback(() => {
    setPendingDeleteId(null)
  }, [])

  const handleToggleArchive = useCallback(
    async (id: string) => {
      try {
        const updated = await courseService.toggleArchiveCourse(id)
        setCourses((prev) => prev.map((c) => (c._id === id ? updated : c)))
        addToast(updated.archived ? 'Course archived' : 'Course unarchived', 'success')
      } catch (err) {
        console.error(err)
        addToast('Failed to update course', 'error')
      }
    },
    [addToast],
  )

  return (
    <div className="min-h-full space-y-8">
      {/* Hero header */}
      <header className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20 px-8 py-8 shadow-xl shadow-black/20">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 rounded-full bg-sky-500/5 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                <BookOpen size={18} />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-50">
                Manage Courses
              </h1>
            </div>
            <p className="max-w-md text-sm text-slate-400">
              Create, publish, and manage your learning content. Your courses appear in the learner catalog when published.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-700/80 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800/70">
              <Archive size={16} className="text-slate-500" />
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:ring-offset-slate-900"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Show archived
            </label>
            <Link
              to={ROUTES.ADMIN.COURSE_NEW}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 active:scale-[0.98]"
            >
              <Plus size={18} />
              New course
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative mt-8 flex flex-wrap gap-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 px-5 py-3 backdrop-blur-sm">
            <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Active</p>
          </div>
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-5 py-3 backdrop-blur-sm">
            <p className="text-2xl font-bold text-emerald-400">{stats.published}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-600/80">Published</p>
          </div>
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-5 py-3 backdrop-blur-sm">
            <p className="text-2xl font-bold text-amber-400">{stats.draft}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-amber-600/80">Draft</p>
          </div>
          {stats.archived > 0 && (
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/30 px-5 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold text-slate-400">{stats.archived}</p>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Archived</p>
            </div>
          )}
        </div>
      </header>

      {/* Course grid */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60 p-0 overflow-hidden"
            >
              <div className="h-40 bg-slate-800" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-3/4 rounded bg-slate-800" />
                <div className="h-3 w-1/2 rounded bg-slate-800" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded-full bg-slate-800" />
                  <div className="h-6 w-20 rounded-full bg-slate-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : visibleCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 px-8 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-500">
            <Sparkles size={28} />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-200">
            {showArchived ? 'No archived courses' : 'No courses yet'}
          </h3>
          <p className="mb-6 max-w-sm text-sm text-slate-400">
            {showArchived
              ? 'Unarchive a course from the list above to see it here.'
              : 'Create your first course to start building your catalog.'}
          </p>
          {!showArchived && (
            <Link
              to={ROUTES.ADMIN.COURSE_NEW}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              <Plus size={18} />
              New course
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCourses.map((course) => (
            <article
              key={course._id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-black/10 transition-all duration-300 hover:border-slate-700 hover:shadow-xl hover:shadow-black/15"
            >
              {/* Cover */}
              <Link
                to={ROUTES.ADMIN.COURSE_EDIT(course._id)}
                className="relative block aspect-[16/10] w-full overflow-hidden bg-slate-800"
              >
                {course.imageUrl ? (
                  <img
                    src={course.imageUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-600">
                    <BookOpen size={40} strokeWidth={1.2} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${
                      course.archived
                        ? 'bg-slate-700/90 text-slate-300'
                        : course.published
                          ? 'bg-emerald-600/90 text-white'
                          : 'bg-amber-500/90 text-slate-900'
                    }`}
                  >
                    {course.archived ? 'Archived' : course.published ? 'Published' : 'Draft'}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-transform group-hover:scale-110">
                    <ChevronRight size={16} />
                  </span>
                </div>
              </Link>

              {/* Body */}
              <div className="flex flex-1 flex-col p-5">
                <Link
                  to={ROUTES.ADMIN.COURSE_EDIT(course._id)}
                  className="mb-2 block font-semibold leading-snug text-slate-100 transition-colors hover:text-indigo-400"
                >
                  {course.title}
                </Link>
                <p className="mb-4 line-clamp-2 text-xs text-slate-400">
                  {course.description || 'No description'}
                </p>
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                    {course.category}
                  </span>
                  <span className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium capitalize text-slate-400">
                    {course.difficulty}
                  </span>
                  {course.estimatedDurationMinutes != null && course.estimatedDurationMinutes > 0 && (
                    <span className="flex items-center gap-1 rounded-lg bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                      <Clock size={11} />
                      {formatDuration(course.estimatedDurationMinutes)}
                    </span>
                  )}
                </div>
                <div className="mt-auto flex items-center gap-2 text-[11px] text-slate-500">
                  <Layers size={12} />
                  <span>{getAllLessons(course).length} lessons</span>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
                  <Link
                    to={ROUTES.ADMIN.COURSE_EDIT(course._id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-300"
                  >
                    <Pencil size={12} />
                    Edit
                  </Link>
                  <Link
                    to={ROUTES.ADMIN.COURSE_DISCUSSION(course._id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-300"
                  >
                    <MessageSquare size={12} />
                    Discussion
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleToggleArchive(course._id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-300"
                    title={course.archived ? 'Unarchive' : 'Archive'}
                  >
                    {course.archived ? (
                      <ArchiveRestore size={12} />
                    ) : (
                      <Archive size={12} />
                    )}
                    {course.archived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRequestDelete(course._id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Delete modal */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <div className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                <Trash2 size={24} />
              </div>
              <h3 id="delete-dialog-title" className="mb-2 text-lg font-semibold text-slate-100">
                Delete course?
              </h3>
              <p className="mb-6 text-sm text-slate-400">
                This action cannot be undone. The course and all its lessons and data will be permanently removed.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
