import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '@/services/api/client'
import { useToast } from '@/context/ToastContext'

interface LessonInput {
  title: string
  content: string
}

export default function CourseEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const isEdit = Boolean(id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [difficulty, setDifficulty] = useState('beginner')
  const [published, setPublished] = useState(false)
  const [lessons, setLessons] = useState<LessonInput[]>([{ title: '', content: '' }])

  useEffect(() => {
    if (!isEdit || !id) return
    apiClient
      .get(`/courses/${id}`)
      .then((res) => {
        const course = res.data
        setTitle(course.title)
        setDescription(course.description)
        setCategory(course.category)
        setImageUrl(course.imageUrl ?? '')
        setDifficulty(course.difficulty)
        setPublished(course.published)
        setLessons(
          course.lessons.length > 0
            ? course.lessons.map((l: { title?: string; content?: string }) => ({
                title: l.title ?? '',
                content: l.content ?? '',
              }))
            : [{ title: '', content: '' }],
        )
      })
      .catch((err) => console.error(err))
  }, [id, isEdit])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const payload = {
      title,
      description,
      category,
      imageUrl: imageUrl.trim() || undefined,
      difficulty,
      published,
      lessons: lessons.map((lesson, index) => ({
        title: lesson.title,
        content: lesson.content,
        order: index + 1,
      })),
    }

    try {
      if (isEdit && id) {
        await apiClient.put(`/courses/${id}`, payload)
        addToast('Course updated', 'success')
      } else {
        await apiClient.post('/courses', payload)
        addToast('Course created', 'success')
      }
      navigate('/admin/courses')
    } catch (err) {
      console.error(err)
      addToast('Failed to save course', 'error')
    }
  }

  const updateLesson = (index: number, field: keyof LessonInput, value: string) => {
    setLessons((prev) => prev.map((lesson, i) => (i === index ? { ...lesson, [field]: value } : lesson)))
  }

  const addLesson = () => {
    setLessons((prev) => [...prev, { title: '', content: '' }])
  }

  const inputBase =
    'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20'
  const labelBase = 'mb-1.5 block text-xs font-medium text-slate-300'

  return (
    <div className="space-y-6 pb-8">
      <header className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/80 p-6 shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isEdit ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'
            }`}
          >
            {isEdit ? 'Edit' : 'New'}
          </span>
          <h2 className="text-2xl font-bold text-slate-100">
            {isEdit ? 'Edit course' : 'Create course'}
          </h2>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Set the title, description, cover image, and lessons. Published courses appear in the learner catalog.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-sky-400">
              1
            </span>
            Course details
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelBase}>Title</label>
              <input
                type="text"
                placeholder="e.g. Introduction to React"
                className={inputBase}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className={labelBase}>Category</label>
              <input
                type="text"
                placeholder="e.g. Web Development"
                className={inputBase}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div>
              <label className={labelBase}>Difficulty</label>
              <select
                className={inputBase}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 transition-colors hover:border-slate-600">
                <input
                  id="published"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-sky-500 focus:ring-2 focus:ring-sky-500 focus:ring-offset-0 focus:ring-offset-slate-950"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
                <span className="text-sm font-medium text-slate-200">Published</span>
              </label>
              <span className="text-xs text-slate-500">Visible in the learner catalog when checked.</span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-sky-400">
              2
            </span>
            Description
          </h3>
          <label className={labelBase}>Course description</label>
          <textarea
            rows={4}
            placeholder="Describe what learners will get from this course..."
            className={`${inputBase} min-h-[100px] resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-sky-400">
              3
            </span>
            Cover image
          </h3>
          <label className={labelBase}>Image URL</label>
          <input
            type="url"
            placeholder="https://example.com/cover.jpg"
            className={inputBase}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          {imageUrl.trim() && (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
              <img
                src={imageUrl}
                alt="Cover preview"
                className="h-32 w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
          <p className="mt-1.5 text-xs text-slate-500">Optional. Shown on course cards in the catalog and My Learning.</p>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-sky-400">
                4
              </span>
              Lessons
            </h3>
            <button
              type="button"
              onClick={addLesson}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              + Add lesson
            </button>
          </div>

          <div className="space-y-4">
            {lessons.map((lesson, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-700/80 bg-slate-950/80 p-4 transition-colors hover:border-slate-600"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-800 text-xs font-bold text-slate-300">
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Lesson {index + 1}</span>
                </div>
                <div className="space-y-3">
                  <input
                    placeholder="Lesson title"
                    className={inputBase}
                    value={lesson.title}
                    onChange={(e) => updateLesson(index, 'title', e.target.value)}
                  />
                  <textarea
                    rows={3}
                    placeholder="Lesson content or key points..."
                    className={`${inputBase} resize-y`}
                    value={lesson.content}
                    onChange={(e) => updateLesson(index, 'content', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <button
            type="button"
            onClick={() => navigate('/admin/courses')}
            className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-sky-500/20 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            {isEdit ? 'Save changes' : 'Create course'}
          </button>
        </div>
      </form>
    </div>
  )
}

