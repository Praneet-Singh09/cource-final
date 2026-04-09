import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'

export default function Dashboard() {
  const { user, userData } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      // Fetch all courses to check existence
      const coursesSnap = await getDocs(collection(db, 'courses'))
      const existingCourseIds = new Set(coursesSnap.docs.map(d => d.id))

      const q = query(collection(db, 'enrollments'), where('studentId', '==', user.uid))
      const snap = await getDocs(q)
      const allEnrollments = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      
      // Filter out enrollments for courses that no longer exist
      const validEnrollments = allEnrollments.filter(e => existingCourseIds.has(e.courseId))
      
      setEnrollments(validEnrollments)
      setLoading(false)
    }
    fetch()
  }, [user.uid])

  const active = enrollments.filter(e => e.status === 'active')
  const pending = enrollments.filter(e => e.status === 'pending')
  const completed = enrollments.filter(e => e.status === 'completed')

  return (
    <div className="min-h-screen bg-[#F9FAF4] text-[#4A6163]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-black text-[#F9A66C] uppercase tracking-[0.3em] mb-2">Student Portal</p>
            <h1 className="text-5xl font-black font-display tracking-tight text-[#4A6163] italic mb-2">
              Welcome Back, <span className="text-[#F17A7E]">{userData?.name}</span>
            </h1>
            <p className="text-[#4A6163]/60 font-medium">Manage your active courses and track your progress</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { label: 'Active Courses', value: active.length, icon: '🚀', highlight: 'bg-[#F9A66C]/10', color: 'text-[#F9A66C]' },
            { label: 'Pending Approval', value: pending.length, icon: '⏳', highlight: 'bg-[#FFC94B]/10', color: 'text-[#FFC94B]' },
            { label: 'Completed', value: completed.length, icon: '🏆', highlight: 'bg-[#F17A7E]/10', color: 'text-[#F17A7E]' },
          ].map(s => (
            <div key={s.label} className={`glass-card p-8 border border-[#4A6163]/5 group hover:border-[#4A6163]/10 transition-all duration-300 ${s.highlight}`}>
              <div className="flex items-center justify-between mb-6">
                <span className="text-3xl">{s.icon}</span>
                <span className="text-[10px] font-black text-[#4A6163]/40 uppercase tracking-widest leading-none">{s.label}</span>
              </div>
              <p className={`text-5xl font-black font-display italic ${s.color} group-hover:scale-110 transition-transform duration-500 origin-left`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex gap-3">
              <div className="w-3 h-3 bg-[#4A6163] rounded-full animate-bounce" />
              <div className="w-3 h-3 bg-[#4A6163] rounded-full animate-bounce [animation-delay:-.3s]" />
              <div className="w-3 h-3 bg-[#4A6163] rounded-full animate-bounce [animation-delay:-.5s]" />
            </div>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="glass-card text-center py-24 border border-dashed border-[#4A6163]/10">
            <div className="mb-8 text-5xl opacity-20">NO_COURSES</div>
            <p className="text-[#4A6163]/50 font-medium mb-10 max-w-md mx-auto">You are not currently enrolled in any courses. Explore the catalog to get started.</p>
            <Link to="/courses" className="btn-primary-glow px-10">
              Browse Courses
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-8 border-b border-[#4A6163]/5 pb-6">
              <h2 className="text-sm font-black text-[#4A6163]/40 uppercase tracking-[0.3em]">My Courses</h2>
              <Link to="/courses" className="text-[10px] font-black text-[#F9A66C] hover:text-[#e8955b] transition-colors uppercase tracking-[0.2em] border-b border-[#F9A66C]/30 pb-1">+ Enroll in New Course</Link>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {enrollments.map(e => (
                <div
                  key={e.id}
                  onClick={() => e.status === 'active' && navigate(`/my-courses/${e.id}`)}
                  className={`glass-card p-8 flex flex-col md:flex-row items-center justify-between group border-[#4A6163]/5 hover:border-[#4A6163]/20 transition-all duration-500
                    ${e.status === 'active' ? 'cursor-pointer' : 'opacity-40 cursor-default grayscale'}`}
                >
                  <div className="flex items-center gap-8 text-center md:text-left">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black font-display text-2xl transition-all duration-500
                      ${e.status === 'active' ? 'bg-[#4A6163]/5 text-[#4A6163] group-hover:bg-[#4A6163] group-hover:text-white' : 'bg-slate-200 text-slate-400'}`}>
                      {e.courseName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex flex-col md:flex-row items-baseline gap-4 mb-2">
                        <h3 className="text-2xl font-black text-[#4A6163] group-hover:text-[#F17A7E] transition-colors uppercase tracking-tight">{e.courseName}</h3>
                        <div className="flex gap-2">
                          {e.status === 'active' && <span className="text-[9px] font-black text-emerald-600 border border-emerald-500/10 px-2 py-0.5 rounded bg-emerald-500/5 uppercase tracking-widest">Active</span>}
                          {e.status === 'pending' && <span className="text-[9px] font-black text-amber-600 border border-amber-500/10 px-2 py-0.5 rounded bg-amber-500/5 uppercase tracking-widest">Pending</span>}
                          {e.status === 'completed' && <span className="text-[9px] font-black text-[#4A6163] border border-[#4A6163]/10 px-2 py-0.5 rounded bg-[#4A6163]/5 uppercase tracking-widest">Completed</span>}
                        </div>
                      </div>
                      <p className="text-[10px] text-[#4A6163]/40 font-bold uppercase tracking-[0.2em]">
                        Enrollment Date: {e.enrolledAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 md:mt-0 flex items-center gap-2 text-[10px] font-black text-[#4A6163] uppercase tracking-widest">
                    {e.status === 'active' ? (
                      <>
                        <span>Enter Course</span>
                        <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                      </>
                    ) : (
                      <span className="italic opacity-40">Awaiting Approval</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}