import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-lg text-gray-900">CourseEnroll</span>
        <div className="flex gap-4 text-sm">
          <Link to="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
          <Link to="/signup" className="bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700">Sign up</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-4xl font-semibold text-gray-900 mb-4">Enroll in courses.<br />Track your progress.</h1>
        <p className="text-gray-500 text-lg mb-8">A simple platform to browse courses, request enrollment, and monitor your academic performance.</p>
        <div className="flex justify-center gap-4">
          <Link to="/signup" className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 text-sm font-medium">Get started</Link>
          <Link to="/login" className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium">Login</Link>
        </div>
      </div>
    </div>
  )
}