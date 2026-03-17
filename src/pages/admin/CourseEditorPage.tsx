import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { apiClient } from '@/services/api/client'
import { ROUTES } from '@/routes/paths'
import { useToast } from '@/context/ToastContext'

interface QuizQuestionInput {
  id: string
  prompt: string
  type: 'single' | 'multiple'
  options: { id: string; text: string }[]
  correctOptionIds: string[]
}

interface LessonInput {
  title: string
  summary: string
  content: string
  videoUrl: string
  estimatedDurationMinutes: number
  quizQuestions: QuizQuestionInput[]
}

interface ModuleInput {
  title: string
  lessons: LessonInput[]
  collapsed: boolean
}

const emptyLesson = (): LessonInput => ({
  title: '',
  summary: '',
  content: '',
  videoUrl: '',
  estimatedDurationMinutes: 0,
  quizQuestions: [],
})

const emptyModule = (): ModuleInput => ({
  title: '',
  lessons: [emptyLesson()],
  collapsed: false,
})

export default function CourseEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    imageUrl: '',
    difficulty: 'beginner',
    published: false,
    modules: [emptyModule()] as ModuleInput[],
  })

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    if (!isEdit || !id) return
    apiClient
      .get(`/courses/${id}`)
      .then((res) => {
        const course = res.data
        const rawModules: ModuleInput[] =
          Array.isArray(course.modules) && course.modules.length > 0
            ? course.modules
                .slice()
                .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
                .map((m: {
                  title?: string
                  lessons?: {
                    title?: string
                    summary?: string
                    content?: string
                    videoUrl?: string
                    estimatedDurationMinutes?: number
                    quizQuestions?: QuizQuestionInput[]
                  }[]
                }) => ({
                  title: m.title ?? '',
                  collapsed: false,
                  lessons:
                    Array.isArray(m.lessons) && m.lessons.length > 0
                      ? m.lessons.map((l) => ({
                          title: l.title ?? '',
                          summary: l.summary ?? '',
                          content: l.content ?? '',
                          videoUrl: l.videoUrl ?? '',
                          estimatedDurationMinutes: l.estimatedDurationMinutes ?? 0,
                          quizQuestions: l.quizQuestions ?? [],
                        }))
                      : [emptyLesson()],
                }))
            : [emptyModule()]

        setFormData({
          title: course.title ?? '',
          description: course.description ?? '',
          category: course.category ?? '',
          imageUrl: course.imageUrl ?? '',
          difficulty: course.difficulty ?? 'beginner',
          published: course.published ?? false,
          modules: rawModules,
        })
      })
      .catch((err) => console.error(err))
  }, [id, isEdit])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      imageUrl: formData.imageUrl.trim() || undefined,
      difficulty: formData.difficulty,
      published: formData.published,
      modules: formData.modules.map((mod, mIdx) => ({
        title: mod.title || `Module ${mIdx + 1}`,
        order: mIdx + 1,
        lessons: mod.lessons.map((lesson, lIdx) => ({
          title: lesson.title,
          summary: lesson.summary || undefined,
          content: lesson.content,
          videoUrl: lesson.videoUrl.trim() || undefined,
          estimatedDurationMinutes:
            typeof lesson.estimatedDurationMinutes === 'number' && lesson.estimatedDurationMinutes > 0
              ? lesson.estimatedDurationMinutes
              : undefined,
          quizQuestions: lesson.quizQuestions?.length ? lesson.quizQuestions : undefined,
          order: lIdx + 1,
        })),
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

  /* ---- Module helpers ---- */
  const addModule = () => {
    setFormData((prev) => ({ ...prev, modules: [...prev.modules, emptyModule()] }))
  }

  const removeModule = (mIdx: number) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== mIdx),
    }))
  }

  const updateModuleTitle = (mIdx: number, title: string) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) => (i === mIdx ? { ...m, title } : m)),
    }))
  }

  const toggleModuleCollapsed = (mIdx: number) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) => (i === mIdx ? { ...m, collapsed: !m.collapsed } : m)),
    }))
  }

  /* ---- Lesson helpers ---- */
  const addLesson = (mIdx: number) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) =>
        i === mIdx ? { ...m, lessons: [...m.lessons, emptyLesson()] } : m,
      ),
    }))
  }

  const removeLesson = (mIdx: number, lIdx: number) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) =>
        i === mIdx ? { ...m, lessons: m.lessons.filter((_, j) => j !== lIdx) } : m,
      ),
    }))
  }

  const updateLesson = (
    mIdx: number,
    lIdx: number,
    field: keyof LessonInput,
    value: string | number | QuizQuestionInput[],
  ) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) =>
        i === mIdx
          ? {
              ...m,
              lessons: m.lessons.map((l, j) =>
                j === lIdx ? { ...l, [field]: value as never } : l,
              ),
            }
          : m,
      ),
    }))
  }

  /* ---- Quiz helpers ---- */
  const setLessonQuiz = (mIdx: number, lIdx: number, questions: QuizQuestionInput[]) => {
    updateLesson(mIdx, lIdx, 'quizQuestions', questions)
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
          Set the title, description, cover image, and modules/lessons. Published courses appear in the learner catalog.
        </p>
        {isEdit && id && (
          <div className="mt-3">
            <Link
              to={ROUTES.ADMIN.COURSE_DISCUSSION(id)}
              className="text-sm text-sky-400 hover:text-sky-300"
            >
              Discussion
            </Link>
          </div>
        )}
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1 — Course details */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <SectionBadge n={1} />
            Course details
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelBase}>Title</label>
              <input
                type="text"
                placeholder="e.g. Introduction to React"
                className={inputBase}
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>
            <div>
              <label className={labelBase}>Category</label>
              <input
                type="text"
                placeholder="e.g. Web Development"
                className={inputBase}
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              />
            </div>
            <div>
              <label className={labelBase}>Difficulty</label>
              <select
                className={inputBase}
                value={formData.difficulty}
                onChange={(e) => handleChange('difficulty', e.target.value)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 transition-colors hover:border-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-sky-500 focus:ring-2 focus:ring-sky-500 focus:ring-offset-0"
                  checked={formData.published}
                  onChange={(e) => handleChange('published', e.target.checked)}
                />
                <span className="text-sm font-medium text-slate-200">Published</span>
              </label>
              <span className="text-xs text-slate-500">Visible in the learner catalog when checked.</span>
            </div>
          </div>
        </section>

        {/* Section 2 — Description */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <SectionBadge n={2} />
            Description
          </h3>
          <label className={labelBase}>Course description</label>
          <textarea
            rows={4}
            placeholder="Describe what learners will get from this course..."
            className={`${inputBase} min-h-[100px] resize-y`}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </section>

        {/* Section 3 — Cover image */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <SectionBadge n={3} />
            Cover image
          </h3>
          <label className={labelBase}>Image URL</label>
          <input
            type="url"
            placeholder="https://example.com/cover.jpg"
            className={inputBase}
            value={formData.imageUrl}
            onChange={(e) => handleChange('imageUrl', e.target.value)}
          />
          {formData.imageUrl.trim() && (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
              <img
                src={formData.imageUrl}
                alt="Cover preview"
                className="h-32 w-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </div>
          )}
          <p className="mt-1.5 text-xs text-slate-500">Optional. Shown on course cards.</p>
        </section>

        {/* Section 4 — Modules & Lessons */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              <SectionBadge n={4} />
              Modules &amp; Lessons
            </h3>
            <button
              type="button"
              onClick={addModule}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <Plus className="h-4 w-4" />
              Add module
            </button>
          </div>

          <div className="space-y-4">
            {formData.modules.map((mod, mIdx) => (
              <div
                key={mIdx}
                className="rounded-xl border border-slate-700 bg-slate-950/60"
              >
                {/* Module header */}
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleModuleCollapsed(mIdx)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    {mod.collapsed
                      ? <ChevronRight className="h-4 w-4" />
                      : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-sky-900/60 text-[10px] font-bold text-sky-300">
                    M{mIdx + 1}
                  </span>
                  <input
                    className="flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-slate-100 placeholder-slate-500 focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600/30"
                    placeholder={`Module ${mIdx + 1} title`}
                    value={mod.title}
                    onChange={(e) => updateModuleTitle(mIdx, e.target.value)}
                  />
                  <span className="ml-auto text-[11px] text-slate-500">
                    {mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}
                  </span>
                  {formData.modules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeModule(mIdx)}
                      className="ml-2 text-slate-500 hover:text-rose-400"
                      title="Remove module"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Lessons */}
                {!mod.collapsed && (
                  <div className="border-t border-slate-700/60 px-4 pb-4 pt-3">
                    <div className="space-y-3">
                      {mod.lessons.map((lesson, lIdx) => (
                        <LessonCard
                          key={lIdx}
                          lesson={lesson}
                          lIdx={lIdx}
                          mIdx={mIdx}
                          canRemove={mod.lessons.length > 1}
                          inputBase={inputBase}
                          labelBase={labelBase}
                          onUpdate={(field, value) => updateLesson(mIdx, lIdx, field, value)}
                          onRemove={() => removeLesson(mIdx, lIdx)}
                          onSetQuiz={(qs) => setLessonQuiz(mIdx, lIdx, qs)}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => addLesson(mIdx)}
                      className="mt-3 flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-sky-600 hover:text-sky-300"
                    >
                      <Plus className="h-3 w-3" />
                      Add lesson
                    </button>
                  </div>
                )}
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

/* ---- Sub-components ---- */

function SectionBadge({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-sky-400">
      {n}
    </span>
  )
}

interface LessonCardProps {
  lesson: LessonInput
  lIdx: number
  mIdx: number
  canRemove: boolean
  inputBase: string
  labelBase: string
  onUpdate: (field: keyof LessonInput, value: string | number | QuizQuestionInput[]) => void
  onRemove: () => void
  onSetQuiz: (qs: QuizQuestionInput[]) => void
}

function LessonCard({ lesson, lIdx, canRemove, inputBase, labelBase, onUpdate, onRemove, onSetQuiz }: LessonCardProps) {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-900/80 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-slate-300">
          {lIdx + 1}
        </span>
        <span className="flex-1 text-xs font-medium text-slate-500">Lesson {lIdx + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-500 hover:text-rose-400"
            title="Remove lesson"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="space-y-3">
        <input
          placeholder="Lesson title"
          className={inputBase}
          value={lesson.title}
          onChange={(e) => onUpdate('title', e.target.value)}
        />
        <textarea
          rows={2}
          placeholder="Short summary..."
          className={`${inputBase} resize-y`}
          value={lesson.summary}
          onChange={(e) => onUpdate('summary', e.target.value)}
        />
        <div>
          <label className={labelBase}>Lesson content</label>
          <textarea
            rows={4}
            placeholder="Lesson content or key points"
            className={`${inputBase} resize-y`}
            value={lesson.content}
            onChange={(e) => onUpdate('content', e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-[2fr,1fr]">
          <div>
            <label className={labelBase}>Video URL (optional)</label>
            <input
              type="url"
              placeholder="https://..."
              className={inputBase}
              value={lesson.videoUrl}
              onChange={(e) => onUpdate('videoUrl', e.target.value)}
            />
          </div>
          <div>
            <label className={labelBase}>Est. minutes</label>
            <input
              type="number"
              min={0}
              max={600}
              className={inputBase}
              value={lesson.estimatedDurationMinutes}
              onChange={(e) => onUpdate('estimatedDurationMinutes', Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <QuizEditor
          questions={lesson.quizQuestions ?? []}
          inputBase={inputBase}
          onChange={onSetQuiz}
        />
      </div>
    </div>
  )
}

interface QuizEditorProps {
  questions: QuizQuestionInput[]
  inputBase: string
  onChange: (qs: QuizQuestionInput[]) => void
}

function QuizEditor({ questions, inputBase, onChange }: QuizEditorProps) {
  const addQuestion = () => {
    onChange([
      ...questions,
      {
        id: `q-${Date.now()}`,
        prompt: '',
        type: 'single',
        options: [
          { id: 'a', text: '' },
          { id: 'b', text: '' },
        ],
        correctOptionIds: [],
      },
    ])
  }

  const removeQuestion = (qi: number) => {
    onChange(questions.filter((_, i) => i !== qi))
  }

  const updateQuestion = (qi: number, patch: Partial<QuizQuestionInput>) => {
    onChange(questions.map((q, i) => (i === qi ? { ...q, ...patch } : q)))
  }

  const addOption = (qi: number) => {
    const q = questions[qi]
    const nextId = String.fromCharCode(97 + q.options.length)
    updateQuestion(qi, { options: [...q.options, { id: nextId, text: '' }] })
  }

  const removeOption = (qi: number, oi: number) => {
    const q = questions[qi]
    const removed = q.options[oi]
    updateQuestion(qi, {
      options: q.options.filter((_, i) => i !== oi),
      correctOptionIds: q.correctOptionIds.filter((id) => id !== removed.id),
    })
  }

  const toggleCorrect = (qi: number, optId: string) => {
    const q = questions[qi]
    if (q.type === 'single') {
      updateQuestion(qi, { correctOptionIds: [optId] })
    } else {
      const set = new Set(q.correctOptionIds)
      if (set.has(optId)) set.delete(optId)
      else set.add(optId)
      updateQuestion(qi, { correctOptionIds: Array.from(set) })
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-slate-700 bg-slate-950/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quiz (optional)</p>
          <p className="text-[11px] text-slate-500">Add quick checks for understanding.</p>
        </div>
        <button
          type="button"
          className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-700"
          onClick={addQuestion}
        >
          + Add question
        </button>
      </div>

      {questions.length === 0 && (
        <p className="text-[11px] text-slate-500">No questions yet.</p>
      )}

      <div className="mt-3 space-y-3">
        {questions.map((q, qi) => (
          <div key={q.id || qi} className="rounded-md border border-slate-700 bg-slate-950/80 p-3 text-xs">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-300">Q{qi + 1}</span>
              <div className="flex items-center gap-2">
                <select
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100"
                  value={q.type}
                  onChange={(e) => updateQuestion(qi, { type: e.target.value as 'single' | 'multiple' })}
                >
                  <option value="single">Single choice</option>
                  <option value="multiple">Multiple choice</option>
                </select>
                <button
                  type="button"
                  className="text-[11px] text-rose-300 hover:text-rose-200"
                  onClick={() => removeQuestion(qi)}
                >
                  Remove
                </button>
              </div>
            </div>
            <input
              className={inputBase}
              placeholder="Question prompt"
              value={q.prompt}
              onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
            />
            <div className="mt-2 space-y-2">
              {q.options.map((opt, oi) => {
                const isCorrect = q.correctOptionIds.includes(opt.id)
                return (
                  <div key={opt.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCorrect(qi, opt.id)}
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-600 text-slate-950'
                          : 'border-slate-600 bg-slate-950 text-slate-500'
                      }`}
                    >
                      {isCorrect ? '✓' : ''}
                    </button>
                    <input
                      className={`${inputBase} text-[11px]`}
                      placeholder={`Option ${oi + 1}`}
                      value={opt.text}
                      onChange={(e) => {
                        const text = e.target.value
                        updateQuestion(qi, {
                          options: q.options.map((o, k) => (k === oi ? { ...o, text } : o)),
                        })
                      }}
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        className="text-[11px] text-slate-400 hover:text-slate-200"
                        onClick={() => removeOption(qi, oi)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })}
              <button
                type="button"
                className="mt-1 text-[11px] text-sky-300 hover:text-sky-200"
                onClick={() => addOption(qi)}
              >
                + Add option
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
