import { type FormEvent, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import type { AppDispatch, RootState } from '@/store'
import { signup } from '@/store/slices/authSlice'
import type { UserRole } from '@/utils/constants'
import { useToast } from '@/context/ToastContext'

export default function SignupPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { status, error } = useSelector((state: RootState) => state.auth)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('learner')
  const nameInputRef = useRef<HTMLInputElement | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      addToast('Please fill out all fields', 'error')
      return
    }

    const result = await dispatch(signup({ name, email, password, role }))
    if (signup.fulfilled.match(result)) {
      addToast('Signed up successfully', 'success')
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
        <h1 className="mb-2 text-2xl font-semibold">Create an Account</h1>
        <p className="mb-6 text-sm text-slate-400">Join Learning Tracker as a learner or admin.</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="Enter your full name"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
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
              placeholder="Create a password"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="learner">Learner</option>
              {/* Note: In a real app, assigning 'admin' role via a public form is a security risk. It's done here for demo purposes. */}
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="flex w-full items-center justify-center rounded bg-sky-600 px-3 py-2 text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
          >
            {status === 'loading' ? 'Signing up...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-sky-400 hover:text-sky-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
