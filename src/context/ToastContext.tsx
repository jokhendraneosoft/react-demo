import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const AUTO_DISMISS_MS = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), AUTO_DISMISS_MS)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastList />
    </ToastContext.Provider>
  )
}

function ToastList() {
  const { toasts, removeToast } = useContext(ToastContext)!
  if (toasts.length === 0) return null
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 shadow-lg min-w-[240px] max-w-sm ${
            t.type === 'success'
              ? 'border-emerald-700 bg-emerald-950/95 text-emerald-100'
              : t.type === 'error'
                ? 'border-rose-700 bg-rose-950/95 text-rose-100'
                : 'border-slate-700 bg-slate-900 text-slate-100'
          }`}
        >
          <span className="text-sm">{t.message}</span>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="text-slate-400 hover:text-slate-200"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
