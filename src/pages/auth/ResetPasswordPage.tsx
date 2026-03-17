import { useState, type FormEvent } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authService } from '@/services/api/auth.service'
import { useToast } from '@/context/ToastContext'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password || password !== confirmPassword || submitting) return
    setSubmitting(true)
    try {
      await authService.resetPassword({ email, password })
      addToast('Your password has been reset. You can now sign in.', 'success')
      navigate('/login')
    } catch (err: any) {
      console.error(err)
      addToast(err?.message || 'Failed to reset password', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const passwordsMismatch = password && confirmPassword && password !== confirmPassword

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-xl bg-slate-900 p-8 shadow-lg shadow-slate-950/50">
        <h1 className="mb-2 text-2xl font-semibold">Reset password</h1>
        <p className="mb-6 text-sm text-slate-400">
          Choose a new password for your account.
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

          <div>
            <label className="mb-1 block text-sm font-medium">New password</label>
            <input
              type="password"
              placeholder="Enter a new password"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Confirm password</label>
            <input
              type="password"
              placeholder="Re-enter your new password"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {passwordsMismatch && (
              <p className="mt-1 text-xs text-rose-400">Passwords do not match.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              submitting ||
              email.trim().length === 0 ||
              password.length === 0 ||
              confirmPassword.length === 0 ||
              !!passwordsMismatch
            }
            className="flex w-full items-center justify-center rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Reset password'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          Remembered your password?{' '}
          <Link to="/login" className="text-sky-400 hover:text-sky-300">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

