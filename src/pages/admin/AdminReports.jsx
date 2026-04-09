import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import Navbar from '../../components/Navbar'

export default function AdminReports() {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, 'courses'))
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    fetch()
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    const fetch = async () => {
      setLoading(true)
      const q = query(collection(db, 'enrollments'), where('courseId', '==', selectedCourse))
      const snap = await getDocs(q)
      setEnrollments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    fetch()
  }, [selectedCourse])

  const stats = {
    total: enrollments.length,
    pending: enrollments.filter(e => e.status === 'pending').length,
    active: enrollments.filter(e => e.status === 'active').length,
    dropped: enrollments.filter(e => e.status === 'dropped').length,
    completed: enrollments.filter(e => e.status === 'completed').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Performance overview per course</p>
        </div>

        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 mb-6 w-full max-w-sm bg-white">
          <option value="">Select a course...</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>

        {selectedCourse && !loading && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total enrolled', value: stats.total },
                { label: 'Pending', value: stats.pending },
                { label: 'Active', value: stats.active },
                { label: 'Completed', value: stats.completed },
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Student</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Email</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Enrolled on</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e, i) => (
                    <tr key={e.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-5 py-3 font-medium text-gray-900">{e.studentName}</td>
                      <td className="px-5 py-3 text-gray-500">{e.studentEmail}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          e.status === 'active' ? 'bg-green-100 text-green-700' :
                          e.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          e.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-600'}`}>{e.status}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{e.enrolledAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}