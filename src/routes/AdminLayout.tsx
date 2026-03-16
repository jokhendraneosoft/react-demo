import { NavLink, Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { logout } from '@/store/slices/authSlice'
import { ROUTES } from '@/routes/paths'

export default function AdminLayout() {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((state: RootState) => state.auth.user)

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Learning Tracker</h1>
          <p className="text-xs text-slate-400">Admin</p>
        </div>
        <nav className="space-y-2">
          <NavLink
            to={ROUTES.ADMIN.COURSES}
            className={({ isActive }) =>
              `block rounded px-3 py-2 text-sm ${isActive ? 'bg-slate-800' : 'hover:bg-slate-800'}`
            }
          >
            Courses
          </NavLink>
          <NavLink
            to={ROUTES.ADMIN.STATS}
            className={({ isActive }) =>
              `block rounded px-3 py-2 text-sm ${isActive ? 'bg-slate-800' : 'hover:bg-slate-800'}`
            }
          >
            Stats
          </NavLink>
        </nav>
        <div className="mt-auto space-y-2 text-xs text-slate-400">
          {user && <p>Signed in as {user.name}</p>}
          <button
            className="w-full rounded bg-slate-800 px-3 py-2 text-left text-xs hover:bg-slate-700"
            onClick={() => dispatch(logout())}
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

