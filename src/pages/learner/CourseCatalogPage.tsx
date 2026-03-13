import { useEffect, useMemo, useState } from 'react'
import { fetchCourses } from '@/services/apiClient'
import { Link } from 'react-router-dom'
import type { Course } from '@/types/api'

const difficultyGradients: Record<string, string> = {
  beginner: 'from-emerald-600/90 to-teal-700/90',
  intermediate: 'from-sky-600/90 to-indigo-700/90',
  advanced: 'from-violet-600/90 to-fuchsia-700/90',
}

function CourseCard({ course }: { course: Course }) {
  const gradient = difficultyGradients[course.difficulty] ?? 'from-slate-600/90 to-slate-700/90'
  const imageUrl = course.imageUrl?.trim()
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = imageUrl && !imgFailed

  return (
    <Link
      to={`/learner/courses/${course._id}`}
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
              {course.title.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/90 backdrop-blur-sm">
            {course.category}
          </span>
          <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-medium capitalize text-white backdrop-blur-sm">
            {course.difficulty}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 line-clamp-2 text-base font-semibold text-slate-100 transition-colors group-hover:text-sky-200">
          {course.title}
        </h3>
        <p className="mb-3 line-clamp-3 flex-1 text-sm text-slate-400">
          {course.description}
        </p>
        <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-3">
          <span className="text-xs text-slate-500">
            {course.lessons?.length ?? 0} lesson{(course.lessons?.length ?? 0) !== 1 ? 's' : ''}
          </span>
          <span className="text-xs font-medium text-sky-400 group-hover:text-sky-300">
            View course →
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function CourseCatalogPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('published')

  useEffect(() => {
    let cancelled = false

    const timeout = setTimeout(() => {
      fetchCourses({
        q: search || undefined,
        category: category || undefined,
        difficulty: (difficulty || undefined) as Course['difficulty'] | undefined,
        status,
      })
        .then((data) => {
          if (!cancelled) {
            setCourses(data)
          }
        })
        .catch((err) => console.error(err))
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [search, category, difficulty, status])

  const availableCategories = useMemo(() => {
    const set = new Set<string>()
    courses.forEach((c) => set.add(c.category))
    return Array.from(set)
  }, [courses])

  const filteredCourses = useMemo(() => courses, [courses])

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Course Catalog</h2>
          <p className="text-sm text-slate-400">Browse available learning paths and courses.</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-900 p-4">
        <input
          type="text"
          placeholder="Search courses..."
          className="flex-1 min-w-[150px] rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select
          className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="published">Published only</option>
          <option value="all">All statuses</option>
          <option value="draft">Draft only</option>
        </select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {filteredCourses.map((course) => (
          <CourseCard key={course._id} course={course} />
        ))}
        {filteredCourses.length === 0 && (
          <p className="col-span-full text-sm text-slate-400">No courses match your filters.</p>
        )}
      </div>
    </div>
  )
}

