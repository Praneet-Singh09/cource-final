import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminCourseManage from './pages/admin/AdminCourseManage'

import Dashboard from './pages/student/Dashboard'
import Courses from './pages/student/Courses'
import CourseDetail from './pages/student/CourseDetail'
import MyPerformance from './pages/student/MyPerformance'

import AdminCourses from './pages/admin/AdminCourses'
import AdminStudents from './pages/admin/AdminStudents'
import AdminEnrollments from './pages/admin/AdminEnrollments'
import AdminReports from './pages/admin/AdminReports'

function StudentRoute({ children }) {
  const { user, userData } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (userData?.role !== 'student') return <Navigate to="/admin/courses" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, userData } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (userData?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { user, userData } = useAuth()

  return (
    <Routes>
      <Route path="/admin/courses/:id/manage" element={<AdminRoute><AdminCourseManage /></AdminRoute>} />
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={!user ? <Login /> : userData?.role === 'admin' ? <Navigate to="/admin/courses" replace /> : <Navigate to="/dashboard" replace />} />
      <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={<StudentRoute><Dashboard /></StudentRoute>} />
      <Route path="/courses" element={<StudentRoute><Courses /></StudentRoute>} />
      <Route path="/courses/:id" element={<StudentRoute><CourseDetail /></StudentRoute>} />
      <Route path="/my-courses/:id" element={<StudentRoute><MyPerformance /></StudentRoute>} />

      <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
      <Route path="/admin/students" element={<AdminRoute><AdminStudents /></AdminRoute>} />
      <Route path="/admin/courses/:id/enrollments" element={<AdminRoute><AdminEnrollments /></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}