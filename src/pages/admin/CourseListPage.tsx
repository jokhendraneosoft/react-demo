import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { courseService } from '@/services/api/course.service'
import type { Course } from '@/types/api'
import { useToast } from '@/context/ToastContext'

export default function CourseListPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const { addToast } = useToast()

  useEffect(() => {
    courseService.fetchCourses({ status: 'all' })
      .then((data) => setCourses(data))
      .catch((err) => {
        console.error(err)
        addToast('Failed to load courses', 'error')
      })
  }, [addToast])

  const visibleCourses = useMemo(
    () => courses.filter((c) => (showArchived ? true : !c.archived)),
    [courses, showArchived],
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
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Manage Courses</h2>
          <p className="text-sm text-slate-400">Create, publish, archive, and delete courses.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              className="h-3 w-3 rounded border-slate-700 bg-slate-950 text-sky-500"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
          <Link
            to="/admin/courses/new"
            className="rounded bg-sky-600 px-3 py-2 text-xs font-medium hover:bg-sky-500"
          >
            New course
          </Link>
        </div>
      </header>

      <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900 text-sm">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-900/80 text-xs text-slate-400">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Title</th>
              <th className="px-4 py-2 text-left font-medium">Category</th>
              <th className="px-4 py-2 text-left font-medium">Difficulty</th>
              <th className="px-4 py-2 text-left font-medium">Status</th>
              <th className="px-4 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleCourses.map((course) => (
              <tr key={course._id} className="border-t border-slate-800">
                <td className="px-4 py-2">{course.title}</td>
                <td className="px-4 py-2 text-xs text-slate-400">{course.category}</td>
                <td className="px-4 py-2 text-xs capitalize text-slate-400">
                  {course.difficulty}
                </td>
                <td className="px-4 py-2 text-xs">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 ${
                      course.archived
                        ? 'bg-slate-800 text-slate-300'
                        : course.published
                          ? 'bg-emerald-900/60 text-emerald-300'
                          : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {course.archived ? 'Archived' : course.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(course._id)}
                      className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
                    >
                      {course.archived ? 'Unarchive' : 'Archive'}
                    </button>
                    <Link
                      to={`/admin/courses/${course._id}/edit`}
                      className="text-xs text-sky-400 hover:text-sky-300"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRequestDelete(course._id)}
                      className="rounded border border-rose-700 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-center text-xs text-slate-400" colSpan={5}>
                  No courses yet. Create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pendingDeleteId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-rose-900 bg-slate-950 px-6 py-5 shadow-xl shadow-black/60">
            <h3 className="mb-2 text-sm font-semibold text-slate-50">Delete course?</h3>
            <p className="mb-4 text-xs text-slate-400">
              This action cannot be undone. The course and its data will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="rounded border border-slate-700 px-3 py-1.5 text-[11px] text-slate-100 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded bg-rose-700 px-3 py-1.5 text-[11px] font-medium text-rose-50 hover:bg-rose-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

