import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-4 text-center">
      <p className="text-6xl font-bold tabular-nums text-slate-600">404</p>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-100">Page not found</h1>
        <p className="max-w-sm text-sm text-slate-400">
          The page you’re looking for doesn’t exist or you don’t have access to it.
        </p>
      </div>
      <Link
        to="/login"
        className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-950"
      >
        Go to sign in
      </Link>
    </div>
  )
}
