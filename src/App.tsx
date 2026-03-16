import { Route, Routes, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import LoginPage from '@/pages/auth/LoginPage'
import SignupPage from '@/pages/auth/SignupPage'
import NotFoundPage from '@/pages/NotFoundPage'
import LearnerLayout from '@/routes/LearnerLayout'
import AdminLayout from '@/routes/AdminLayout'
import CourseCatalogPage from '@/pages/learner/CourseCatalogPage'
import CourseDetailPage from '@/pages/learner/CourseDetailPage'
import LessonViewPage from '@/pages/learner/LessonViewPage'
import MyLearningPage from '@/pages/learner/MyLearningPage'
import ProfilePage from '@/pages/learner/ProfilePage'
import AdminCourseListPage from '@/pages/admin/CourseListPage'
import AdminCourseEditorPage from '@/pages/admin/CourseEditorPage'
import AdminStatsDashboardPage from '@/pages/admin/StatsDashboardPage'

function RequireAuth({ children, role }: { children: React.ReactNode; role?: 'learner' | 'admin' }) {
  const { user } = useSelector((state: RootState) => state.auth)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role && user.role !== role) {
    return <Navigate to="/login" replace />
  }

  return children
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const { user } = useSelector((state: RootState) => state.auth)

  if (user) {
    const target = user.role === 'admin' ? '/admin/courses' : '/learner/catalog'
    return <Navigate to={target} replace />
  }

  return children
}

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            <RequireGuest>
              <LoginPage />
            </RequireGuest>
          }
        />
        <Route
          path="/signup"
          element={
            <RequireGuest>
              <SignupPage />
            </RequireGuest>
          }
        />

        <Route
          path="/learner"
          element={
            <RequireAuth role="learner">
              <LearnerLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="catalog" replace />} />
          <Route path="catalog" element={<CourseCatalogPage />} />
          <Route path="courses/:id" element={<CourseDetailPage />} />
          <Route path="courses/:courseId/lessons/:lessonId" element={<LessonViewPage />} />
          <Route path="my-learning" element={<MyLearningPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAuth role="admin">
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="courses" replace />} />
          <Route path="courses" element={<AdminCourseListPage />} />
          <Route path="courses/new" element={<AdminCourseEditorPage />} />
          <Route path="courses/:id/edit" element={<AdminCourseEditorPage />} />
          <Route path="stats" element={<AdminStatsDashboardPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default App
