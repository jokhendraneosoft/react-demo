import type { ReactNode } from 'react'

interface ErrorPanelProps {
  title?: string
  message?: string
  children?: ReactNode
}

export function ErrorPanel({ title = 'Something went wrong', message, children }: ErrorPanelProps) {
  return (
    <div className="rounded-xl border border-red-900/70 bg-red-950/40 p-6 text-sm text-red-50 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-900/80 text-[10px] font-bold">
          !
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {message && <p className="text-xs text-red-100">{message}</p>}
      {children && <div className="mt-3 text-xs text-red-100">{children}</div>}
    </div>
  )
}

