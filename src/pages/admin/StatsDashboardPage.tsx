import { useEffect, useMemo, useState } from 'react'
import { adminService } from '@/services/api/admin.service'
import type { AdminOverviewStats } from '@/types/api'

export default function StatsDashboardPage() {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null)

  useEffect(() => {
    adminService.fetchOverviewStats()
      .then((data) => setStats(data))
      .catch((err) => console.error(err))
  }, [])

  const mostPopularCourse = useMemo(() => {
    if (!stats || stats.enrollmentsPerCourse.length === 0) return null
    return stats.enrollmentsPerCourse[0]
  }, [stats])

  if (!stats) {
    return <p className="text-sm text-slate-400">Loading stats...</p>
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Analytics overview</h2>
        <p className="text-sm text-slate-400">
          Simple admin analytics to show how learners engage with content.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm">
          <p className="text-xs text-slate-400">Total courses</p>
          <p className="mt-1 text-2xl font-semibold">{stats.courseCount}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm">
          <p className="text-xs text-slate-400">Tracked enrollments</p>
          <p className="mt-1 text-2xl font-semibold">
            {stats.enrollmentsPerCourse.reduce((sum, c) => sum + c.enrollments, 0)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm">
          <p className="text-xs text-slate-400">Active learners</p>
          <p className="mt-1 text-2xl font-semibold">{stats.activeLearners}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm">
          <h3 className="mb-2 text-sm font-semibold">Enrollments by course</h3>
          <ul className="space-y-1 text-xs text-slate-300">
            {stats.enrollmentsPerCourse.map((c) => (
              <li key={c._id} className="flex items-center justify-between">
                <span>Course {c._id}</span>
                <span className="text-slate-400">{c.enrollments} enrollments</span>
              </li>
            ))}
            {stats.enrollmentsPerCourse.length === 0 && (
              <p className="text-xs text-slate-400">No enrollments yet.</p>
            )}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm">
          <h3 className="mb-2 text-sm font-semibold">Course completion rate</h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {stats.completionPerCourse.map((c) => {
              const pct = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0
              return (
                <li key={c._id}>
                  <div className="mb-1 flex items-center justify-between">
                    <span>Course {c._id}</span>
                    <span className="text-slate-400">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
            {stats.completionPerCourse.length === 0 && (
              <p className="text-xs text-slate-400">No completion data yet.</p>
            )}
          </ul>
        </div>
      </div>

      {mostPopularCourse && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-xs text-slate-300">
          <p>
            <span className="font-medium">Most enrolled course ID:</span> {mostPopularCourse._id} (
            {mostPopularCourse.enrollments} enrollments)
          </p>
        </div>
      )}
    </div>
  )
}

