import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4">
          <h1 className="text-xl font-semibold text-slate-100">Something went wrong</h1>
          <p className="max-w-md text-center text-sm text-slate-400">
            {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/login'
            }}
            className="rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Back to sign in
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
