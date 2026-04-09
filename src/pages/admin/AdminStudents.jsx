import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import Navbar from '../../components/Navbar'

export default function AdminStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, 'users'))
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setStudents(all.filter(u => u.role === 'student'))
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-1">{students.length} registered students</p>
        </div>

        {loading ? <p className="text-sm text-gray-500">Loading...</p> : students.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No students registered yet.</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Email</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-5 py-3 text-gray-500">{s.email}</td>
                    <td className="px-5 py-3 text-gray-500">{s.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}