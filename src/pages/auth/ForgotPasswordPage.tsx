import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '@/services/api/auth.service'
import { useToast } from '@/context/ToastContext'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { addToast } = useToast()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || submitting) return
    setSubmitting(true)
    try {
      await authService.forgotPassword({ email })
      addToast(
        'If an account exists for that email, a reset link has been sent.',
        'success'
      )
    } catch (err: any) {
      console.error(err)
      addToast(err?.message || 'Failed to request password reset', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-xl bg-slate-900 p-8 shadow-lg shadow-slate-950/50">
        <h1 className="mb-2 text-2xl font-semibold">Forgot password</h1>
        <p className="mb-6 text-sm text-slate-400">
          Enter your email and we&apos;ll send instructions to reset your password.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="flex w-full items-center justify-center rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          Remember your password?{' '}
          <Link to="/login" className="text-sky-400 hover:text-sky-300">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

