import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  BookOpen,
  GraduationCap,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react'
import type { RootState, AppDispatch } from '@/store'
import { logout } from '@/store/slices/authSlice'
import { ROUTES } from '@/routes/paths'

const NAV_ITEMS = [
  {
    to: ROUTES.LEARNER.CATALOG,
    label: 'Course Catalog',
    icon: BookOpen,
  },
  {
    to: ROUTES.LEARNER.MY_LEARNING,
    label: 'My Learning',
    icon: GraduationCap,
  },
  {
    to: ROUTES.LEARNER.PROFILE,
    label: 'Profile',
    icon: UserCircle,
  },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function LearnerLayout() {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((state: RootState) => state.auth.user)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    const userId = user?.id ?? 'anonymous'
    try {
      const raw = window.localStorage.getItem(`learner_sidebar_${userId}`)
      return raw === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const userId = user?.id ?? 'anonymous'
    try {
      window.localStorage.setItem(`learner_sidebar_${userId}`, collapsed ? '1' : '0')
    } catch {
      // ignore persistence errors
    }
  }, [collapsed, user?.id])

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside
        className={`relative flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Toggle button — sits on the right edge of the sidebar */}
        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3.5 top-6 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 shadow-md transition-colors hover:bg-indigo-600 hover:text-white hover:border-indigo-500"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-800 ${collapsed ? 'justify-center px-0' : ''}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <LayoutDashboard size={16} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="truncate text-sm font-semibold text-slate-100 leading-tight">Learning Tracker</p>
              <p className="text-xs text-indigo-400 font-medium">Learner Portal</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 border border-transparent hover:bg-slate-800 hover:text-slate-100'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={`shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                  />
                  {!collapsed && <span className="truncate">{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className={`border-t border-slate-800 p-3 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
          {!collapsed && user && (
            <div className="mb-2 flex items-center gap-3 rounded-lg bg-slate-800/60 px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                {getInitials(user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-200">{user.name}</p>
                <p className="text-[10px] text-slate-500">Learner</p>
              </div>
            </div>
          )}

          {collapsed && user && (
            <div
              title={user.name}
              className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white"
            >
              {getInitials(user.name)}
            </div>
          )}

          <button
            type="button"
            title="Log out"
            onClick={() => dispatch(logout())}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400 ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <LogOut size={15} className="shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
