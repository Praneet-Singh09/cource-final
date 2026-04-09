import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'

export default function AdminEnrollments() {
  const { id } = useParams()
  const [enrollments, setEnrollments] = useState([])
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const courseSnap = await getDocs(collection(db, 'courses'))
    const courseDoc = courseSnap.docs.find(d => d.id === id)
    if (courseDoc) setCourse({ id: courseDoc.id, ...courseDoc.data() })

    const q = query(collection(db, 'enrollments'), where('courseId', '==', id))
    const snap = await getDocs(q)
    setEnrollments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  const updateStatus = async (enrollmentId, status) => {
    await updateDoc(doc(db, 'enrollments', enrollmentId), { status })
    fetchData()
  }

  const pending = enrollments.filter(e => e.status === 'pending')
  const active = enrollments.filter(e => e.status === 'active')
  const others = enrollments.filter(e => e.status !== 'pending' && e.status !== 'active')

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      active: 'bg-green-100 text-green-700',
      dropped: 'bg-red-100 text-red-700',
      completed: 'bg-blue-100 text-blue-700',
    }
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status]}`}>{status}</span>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{course?.title || 'Course'} — Enrollments</h1>
          <p className="text-sm text-gray-500 mt-1">{enrollments.length} total · {pending.length} pending</p>
        </div>

        {loading ? <p className="text-sm text-gray-500">Loading...</p> : (
          <>
            {pending.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-gray-700 mb-3">Pending requests</h2>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-5 py-3 text-gray-500 font-medium">Student</th>
                        <th className="text-left px-5 py-3 text-gray-500 font-medium">Email</th>
                        <th className="text-left px-5 py-3 text-gray-500 font-medium">Requested</th>
                        <th className="text-left px-5 py-3 text-gray-500 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map(e => (
                        <tr key={e.id} className="border-t border-gray-100">
                          <td className="px-5 py-3 font-medium text-gray-900">{e.studentName}</td>
                          <td className="px-5 py-3 text-gray-500">{e.studentEmail}</td>
                          <td className="px-5 py-3 text-gray-500">{e.enrolledAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</td>
                          <td className="px-5 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => updateStatus(e.id, 'active')}
                                className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-100">Accept</button>
                              <button onClick={() => updateStatus(e.id, 'dropped')}
                                className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-100">Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-sm font-medium text-gray-700 mb-3">Active enrollments</h2>
              {active.length === 0 ? (
                <p className="text-sm text-gray-400">No active enrollments yet.</p>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-5 py-3 text-gray-500 font-medium">Student</th>
                        <th className="text-left px-5 py-3 text-gray-500 font-medium">Email</th>
                        <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                        <th className="text-left px-5 py-3 text-gray-500 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {active.map(e => (
                        <tr key={e.id} className="border-t border-gray-100">
                          <td className="px-5 py-3 font-medium text-gray-900">{e.studentName}</td>
                          <td className="px-5 py-3 text-gray-500">{e.studentEmail}</td>
                          <td className="px-5 py-3"><StatusBadge status={e.status} /></td>
                          <td className="px-5 py-3">
                            <button onClick={() => updateStatus(e.id, 'completed')}
                              className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-100">Mark completed</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}