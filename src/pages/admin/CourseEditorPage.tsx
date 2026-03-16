import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '@/services/api/client'
import { useToast } from '@/context/ToastContext'

interface LessonInput {
  title: string
  summary: string
  content: string
  videoUrl: string
  estimatedDurationMinutes: number
  quizQuestions: {
    id: string
    prompt: string
    type: 'single' | 'multiple'
    options: { id: string; text: string }[]
    correctOptionIds: string[]
  }[]
}

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
    lessons: [
      {
        title: '',
        summary: '',
        content: '',
        videoUrl: '',
        estimatedDurationMinutes: 0,
        quizQuestions: [],
      },
    ] as LessonInput[],
  })

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    if (!isEdit || !id) return
    apiClient
      .get(`/courses/${id}`)
      .then((res) => {
        const course = res.data
        setFormData({
          title: course.title,
          description: course.description,
          category: course.category,
          imageUrl: course.imageUrl ?? '',
          difficulty: course.difficulty,
          published: course.published,
          lessons:
            course.lessons.length > 0
              ? course.lessons.map(
                  (l: {
                    title?: string
                    content?: string
                    summary?: string
                    videoUrl?: string
                    estimatedDurationMinutes?: number
                    quizQuestions?: {
                      id: string
                      prompt: string
                      type: 'single' | 'multiple'
                      options: { id: string; text: string }[]
                      correctOptionIds: string[]
                    }[]
                  }) => ({
                    title: l.title ?? '',
                    summary: l.summary ?? '',
                    content: l.content ?? '',
                    videoUrl: l.videoUrl ?? '',
                    estimatedDurationMinutes: l.estimatedDurationMinutes ?? 0,
                    quizQuestions: l.quizQuestions ?? [],
                  }),
                )
              : [
                  {
                    title: '',
                    summary: '',
                    content: '',
                    videoUrl: '',
                    estimatedDurationMinutes: 0,
                    quizQuestions: [],
                  },
                ],
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
      lessons: formData.lessons.map((lesson, index) => ({
        title: lesson.title,
        summary: lesson.summary || undefined,
        content: lesson.content,
        videoUrl: lesson.videoUrl.trim() || undefined,
        estimatedDurationMinutes:
          typeof lesson.estimatedDurationMinutes === 'number' &&
          lesson.estimatedDurationMinutes > 0
            ? lesson.estimatedDurationMinutes
            : undefined,
        quizQuestions: lesson.quizQuestions?.length ? lesson.quizQuestions : undefined,
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
    setFormData((prev) => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) => (i === index ? { ...lesson, [field]: value } : lesson))
    }))
  }

  const addLesson = () => {
    setFormData((prev) => ({
      ...prev,
      lessons: [
        ...prev.lessons,
        {
          title: '',
          summary: '',
          content: '',
          videoUrl: '',
          estimatedDurationMinutes: 0,
        },
      ],
    }))
  }

  // simple markdown-like helper: users can use **bold**, _italic_, lists, etc.

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
                  id="published"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-sky-500 focus:ring-2 focus:ring-sky-500 focus:ring-offset-0 focus:ring-offset-slate-950"
                  checked={formData.published}
                  onChange={(e) => handleChange('published', e.target.checked)}
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
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
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
            value={formData.imageUrl}
            onChange={(e) => handleChange('imageUrl', e.target.value)}
          />
          {formData.imageUrl.trim() && (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
              <img
                src={formData.imageUrl}
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
            {formData.lessons.map((lesson, index) => (
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
                    rows={2}
                    placeholder="Short summary of this lesson..."
                    className={`${inputBase} resize-y`}
                    value={lesson.summary}
                    onChange={(e) => updateLesson(index, 'summary', e.target.value)}
                  />
                  <div>
                    <label className={labelBase}>Lesson content</label>
                    <textarea
                      rows={4}
                      placeholder="Lesson content or key points (you can use simple markdown like **bold**, lists, etc.)"
                      className={`${inputBase} resize-y`}
                      value={lesson.content}
                      onChange={(e) => updateLesson(index, 'content', e.target.value)}
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
                        onChange={(e) => updateLesson(index, 'videoUrl', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelBase}>Estimated minutes</label>
                      <input
                        type="number"
                        min={0}
                        max={600}
                        className={inputBase}
                        value={lesson.estimatedDurationMinutes}
                        onChange={(e) =>
                          updateLesson(index, 'estimatedDurationMinutes', Number(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Quiz (optional)
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Add quick checks for understanding at the end of this lesson.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-700"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            lessons: prev.lessons.map((l, i) =>
                              i === index
                                ? {
                                    ...l,
                                    quizQuestions: [
                                      ...(l.quizQuestions ?? []),
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
                                    ],
                                  }
                                : l,
                            ),
                          }))
                        }}
                      >
                        + Add question
                      </button>
                    </div>

                    {(lesson.quizQuestions ?? []).length === 0 && (
                      <p className="text-[11px] text-slate-500">
                        No questions yet. Learners can still complete the lesson without a quiz.
                      </p>
                    )}

                    <div className="mt-3 space-y-3">
                      {(lesson.quizQuestions ?? []).map((q, qIndex) => (
                        <div
                          key={q.id || qIndex}
                          className="rounded-md border border-slate-700 bg-slate-950/80 p-3 text-xs"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-300">
                              Question {qIndex + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <select
                                className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100"
                                value={q.type}
                                onChange={(e) => {
                                  const type = e.target.value as 'single' | 'multiple'
                                  setFormData((prev) => ({
                                    ...prev,
                                    lessons: prev.lessons.map((l, i) =>
                                      i === index
                                        ? {
                                            ...l,
                                            quizQuestions: l.quizQuestions.map((qq, j) =>
                                              j === qIndex ? { ...qq, type } : qq,
                                            ),
                                          }
                                        : l,
                                    ),
                                  }))
                                }}
                              >
                                <option value="single">Single choice</option>
                                <option value="multiple">Multiple choice</option>
                              </select>
                              <button
                                type="button"
                                className="text-[11px] text-rose-300 hover:text-rose-200"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    lessons: prev.lessons.map((l, i) =>
                                      i === index
                                        ? {
                                            ...l,
                                            quizQuestions: l.quizQuestions.filter(
                                              (_qq, j) => j !== qIndex,
                                            ),
                                          }
                                        : l,
                                    ),
                                  }))
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <input
                            className={inputBase}
                            placeholder="Question prompt"
                            value={q.prompt}
                            onChange={(e) => {
                              const prompt = e.target.value
                              setFormData((prev) => ({
                                ...prev,
                                lessons: prev.lessons.map((l, i) =>
                                  i === index
                                    ? {
                                        ...l,
                                        quizQuestions: l.quizQuestions.map((qq, j) =>
                                          j === qIndex ? { ...qq, prompt } : qq,
                                        ),
                                      }
                                    : l,
                                ),
                              }))
                            }}
                          />
                          <div className="mt-2 space-y-2">
                            {q.options.map((opt, optIndex) => {
                              const isCorrect = q.correctOptionIds.includes(opt.id)
                              const toggleCorrect = () => {
                                setFormData((prev) => ({
                                  ...prev,
                                  lessons: prev.lessons.map((l, i) =>
                                    i === index
                                      ? {
                                          ...l,
                                          quizQuestions: l.quizQuestions.map((qq, j) => {
                                            if (j !== qIndex) return qq
                                            if (qq.type === 'single') {
                                              return { ...qq, correctOptionIds: [opt.id] }
                                            }
                                            const set = new Set(qq.correctOptionIds)
                                            if (set.has(opt.id)) set.delete(opt.id)
                                            else set.add(opt.id)
                                            return { ...qq, correctOptionIds: Array.from(set) }
                                          }),
                                        }
                                      : l,
                                  ),
                                }))
                              }

                              return (
                                <div key={opt.id || optIndex} className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={toggleCorrect}
                                    className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                                      isCorrect
                                        ? 'border-emerald-500 bg-emerald-600 text-slate-950'
                                        : 'border-slate-600 bg-slate-950 text-slate-500'
                                    }`}
                                  >
                                    {isCorrect ? '✓' : ''}
                                  </button>
                                  <input
                                    className={`${inputBase} text-[11px]`}
                                    placeholder={`Option ${optIndex + 1}`}
                                    value={opt.text}
                                    onChange={(e) => {
                                      const text = e.target.value
                                      setFormData((prev) => ({
                                        ...prev,
                                        lessons: prev.lessons.map((l, i) =>
                                          i === index
                                            ? {
                                                ...l,
                                                quizQuestions: l.quizQuestions.map((qq, j) =>
                                                  j === qIndex
                                                    ? {
                                                        ...qq,
                                                        options: qq.options.map((oo, k) =>
                                                          k === optIndex ? { ...oo, text } : oo,
                                                        ),
                                                      }
                                                    : qq,
                                                ),
                                              }
                                            : l,
                                        ),
                                      }))
                                    }}
                                  />
                                  {q.options.length > 2 && (
                                    <button
                                      type="button"
                                      className="text-[11px] text-slate-400 hover:text-slate-200"
                                      onClick={() => {
                                        setFormData((prev) => ({
                                          ...prev,
                                          lessons: prev.lessons.map((l, i) =>
                                            i === index
                                              ? {
                                                  ...l,
                                                  quizQuestions: l.quizQuestions.map((qq, j) =>
                                                    j === qIndex
                                                      ? {
                                                          ...qq,
                                                          options: qq.options.filter(
                                                            (_oo, k) => k !== optIndex,
                                                          ),
                                                          correctOptionIds: qq.correctOptionIds.filter(
                                                            (id) => id !== opt.id,
                                                          ),
                                                        }
                                                      : qq,
                                                  ),
                                                }
                                              : l,
                                          ),
                                        }))
                                      }}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                            <button
                              type="button"
                              className="mt-1 text-[11px] text-sky-300 hover:text-sky-200"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  lessons: prev.lessons.map((l, i) =>
                                    i === index
                                      ? {
                                          ...l,
                                          quizQuestions: l.quizQuestions.map((qq, j) =>
                                            j === qIndex
                                              ? {
                                                  ...qq,
                                                  options: [
                                                    ...qq.options,
                                                    {
                                                      id: String.fromCharCode(97 + qq.options.length),
                                                      text: '',
                                                    },
                                                  ],
                                                }
                                              : qq,
                                          ),
                                        }
                                      : l,
                                  ),
                                }))
                              }}
                            >
                              + Add option
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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

