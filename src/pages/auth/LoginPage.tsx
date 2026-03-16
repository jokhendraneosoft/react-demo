import { type FormEvent, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import type { AppDispatch, RootState } from '@/store'
import { login } from '@/store/slices/authSlice'
import { useToast } from '@/context/ToastContext'

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { status, error } = useSelector((state: RootState) => state.auth)
  const [email, setEmail] = useState('learner@example.com')
  const [password, setPassword] = useState('Password123!')
  const emailInputRef = useRef<HTMLInputElement | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const result = await dispatch(login({ email, password }))
    if (login.fulfilled.match(result)) {
      addToast('Signed in successfully', 'success')
      if (result.payload.user.role === 'admin') {
        navigate('/admin/courses')
      } else {
        navigate('/learner/catalog')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-xl bg-slate-900 p-8 shadow-lg shadow-slate-950/50">
        <h1 className="mb-2 text-2xl font-semibold">Learning Tracker</h1>
        <p className="mb-6 text-sm text-slate-400">Sign in as learner or admin to continue.</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              ref={emailInputRef}
              type="email"
              placeholder="Enter your email"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="flex w-full items-center justify-center rounded bg-sky-600 px-3 py-2 text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
          >
            {status === 'loading' ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-sky-400 hover:text-sky-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

