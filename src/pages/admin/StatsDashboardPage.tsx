import { useEffect, useMemo, useState } from 'react'
import { adminService } from '@/services/api/admin.service'
import type { AdminOverviewStats, AdminStatsRange } from '@/types/api'
import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton'

export default function StatsDashboardPage() {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null)
  const [range, setRange] = useState<AdminStatsRange>('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    adminService
      .fetchOverviewStats(range)
      .then((data) => setStats(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [range])

  const mostPopularCourse = useMemo(() => {
    if (!stats || stats.enrollmentsPerCourse.length === 0) return null
    return stats.enrollmentsPerCourse[0]
  }, [stats])

  const totalEnrollments = useMemo(
    () => stats?.enrollmentsPerCourse.reduce((sum, c) => sum + c.enrollments, 0) ?? 0,
    [stats]
  )

  if (!stats || loading) {
    return (
      <div className="space-y-4">
        <header>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <TextSkeleton className="h-5 w-40" />
              <TextSkeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-8 w-56 rounded-full" />
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm"
            >
              <TextSkeleton className="h-3 w-24" />
              <TextSkeleton className="mt-3 h-6 w-16" />
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm space-y-2">
            <TextSkeleton className="h-4 w-32" />
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <TextSkeleton className="h-3 w-40" />
                <TextSkeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm space-y-3">
            <TextSkeleton className="h-4 w-40" />
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="space-y-1">
                <TextSkeleton className="h-3 w-48" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Analytics overview</h2>
            <p className="text-sm text-slate-400">
              Simple admin analytics to show how learners engage with content.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/60 p-1 text-xs">
            <span className="px-2 text-slate-400">Range</span>
            {(['7d', '30d', 'all'] as AdminStatsRange[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={`rounded-full px-2.5 py-1 ${
                  range === option
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {option === '7d' && 'Last 7 days'}
                {option === '30d' && 'Last 30 days'}
                {option === 'all' && 'All time'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm">
          <p className="text-xs text-slate-400">Total courses</p>
          <p className="mt-1 text-2xl font-semibold">{stats.courseCount}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm">
          <p className="text-xs text-slate-400">Tracked enrollments</p>
          <p className="mt-1 text-2xl font-semibold">
            {totalEnrollments}
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
              <li key={c.courseId} className="flex items-center justify-between">
                <span className="flex-1 truncate">
                  {c.courseTitle}
                  <span className="ml-1 text-[10px] text-slate-500">({c.category})</span>
                </span>
                <span className="ml-2 text-slate-400">{c.enrollments} enrollments</span>
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
                <li key={c.courseId}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex-1 truncate">
                      {c.courseTitle}
                      <span className="ml-1 text-[10px] text-slate-500">({c.category})</span>
                    </span>
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
          <p className="mb-1 text-slate-200">
            <span className="font-medium">Top course:</span> {mostPopularCourse.courseTitle}
          </p>
          <p className="text-slate-400">
            {mostPopularCourse.enrollments} enrollments · {mostPopularCourse.category}
          </p>
        </div>
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm">
        <h3 className="mb-2 text-sm font-semibold">Enrollments over time</h3>
        {stats.enrollmentsTimeSeries.length === 0 ? (
          <p className="text-xs text-slate-400">No enrollment activity in this range.</p>
        ) : (
          <div className="mt-2 h-32">
            <div className="flex h-full items-end gap-1">
              {stats.enrollmentsTimeSeries.map((point) => {
                const max =
                  Math.max(
                    ...stats.enrollmentsTimeSeries.map((p) => p.count || 0)
                  ) || 1
                const heightPct = Math.round((point.count / max) * 100)
                return (
                  <div
                    key={point.date}
                    className="flex-1 rounded-t bg-sky-600"
                    style={{ height: `${heightPct}%` }}
                    title={`${point.date}: ${point.count} enrollments`}
                  />
                )
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-500">
              <span>{stats.enrollmentsTimeSeries[0]?.date}</span>
              <span>{stats.enrollmentsTimeSeries[stats.enrollmentsTimeSeries.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

