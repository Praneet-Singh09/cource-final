import { useState, useEffect } from 'react'
import { doc, getDoc, collection, getDocs, query, where, addDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/Navbar'

export default function CourseDetail() {
  const { id } = useParams()
  const { user, userData } = useAuth()
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [enrollmentStatus, setEnrollmentStatus] = useState(null)
  const [enrolling, setEnrolling] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const courseSnap = await getDoc(doc(db, 'courses', id))
      if (courseSnap.exists()) setCourse({ id: courseSnap.id, ...courseSnap.data() })

      const modulesSnap = await getDocs(query(collection(db, 'modules'), where('courseId', '==', id)))
      setModules(modulesSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.orderIndex - b.orderIndex))

      const enrollSnap = await getDocs(query(collection(db, 'enrollments'), where('studentId', '==', user.uid), where('courseId', '==', id)))
      if (!enrollSnap.empty) setEnrollmentStatus(enrollSnap.docs[0].data().status)
      setLoading(false)
    }
    fetch()
  }, [id, user.uid])

  const handleEnroll = async () => {
    setEnrolling(true)
    await addDoc(collection(db, 'enrollments'), {
      studentId: user.uid,
      studentName: userData.name,
      studentEmail: userData.email,
      courseId: id,
      courseName: course.title,
      status: 'pending',
      enrolledAt: new Date()
    })
    setEnrollmentStatus('pending')
    setEnrolling(false)
  }

  const isEnrolled = !!enrollmentStatus

  if (loading) return <div className="min-h-screen bg-[#F9FAF4]"><Navbar /><p className="p-6 text-sm text-[#4A6163]/50">Loading...</p></div>
  if (!course) return <div className="min-h-screen bg-[#F9FAF4]"><Navbar /><p className="p-6 text-sm text-[#4A6163]/50">Course not found.</p></div>

  return (
    <div className="min-h-screen bg-[#F9FAF4] text-[#4A6163]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-40 pb-20">
        
        <button onClick={() => window.history.back()}
          className="text-[10px] font-black text-[#4A6163]/40 hover:text-[#F9A66C] mb-10 flex items-center gap-2 uppercase tracking-[0.2em] transition-all group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Catalog
        </button>

        <div className="glass-card overflow-hidden border-[#4A6163]/5 shadow-2xl mb-12">
          <div className="h-3 w-full bg-gradient-to-r from-[#F9A66C] via-[#FFC94B] to-[#F17A7E]" />
          <div className="p-10">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-black text-[#F17A7E] border border-[#F17A7E]/20 px-4 py-2 rounded-full bg-[#F17A7E]/5 uppercase tracking-[0.3em]">
                {course.category}
              </span>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Admissions Open</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black font-display text-[#4A6163] mb-6 italic tracking-tight leading-none uppercase">
              {course.title}
            </h1>
            
            <p className="text-lg text-[#4A6163]/70 mb-10 font-medium leading-relaxed border-l-4 border-[#F9A66C]/40 pl-8 py-2">
              {course.description}
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-10 border-y border-[#4A6163]/5 mb-10">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-[#4A6163]/30 uppercase tracking-widest leading-none">Instructor</p>
                <p className="text-sm font-black text-[#4A6163] italic">{course.instructor}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black text-[#4A6163]/30 uppercase tracking-widest leading-none">Merit Units</p>
                <p className="text-2xl font-black text-[#F17A7E] italic font-display leading-none">{course.credits}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black text-[#4A6163]/30 uppercase tracking-widest leading-none">Max Capacity</p>
                <p className="text-2xl font-black text-[#4A6163] italic font-display leading-none">{course.maxCapacity}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black text-[#4A6163]/30 uppercase tracking-widest leading-none">Module Count</p>
                <p className="text-2xl font-black text-emerald-600 italic font-display leading-none">{modules.length}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {!isEnrolled ? (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn-primary-glow flex-1 !h-16 !text-xs !bg-[#4A6163]"
                >
                  {enrolling ? 'Synchronizing...' : 'Request Admissions Access'}
                </button>
              ) : (
                <div className="flex-1 text-center py-4 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] border border-emerald-500/10 rounded-2xl bg-emerald-500/5 h-16 flex items-center justify-center">
                  Enrollment {enrollmentStatus === 'pending' ? 'Pending Approval' : 'Active'}
                </div>
              )}
              <button onClick={() => navigate('/courses')} className="btn-ghost px-10 h-16 !border-[#4A6163]/10">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <div className="flex items-center gap-6 mb-10">
            <h2 className="text-sm font-black text-[#4A6163]/30 uppercase tracking-[0.5em]">Curriculum Index</h2>
            <div className="flex-1 h-px bg-[#4A6163]/10" />
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {modules.map((m, i) => (
              <div key={m.id} className="glass-card group p-8 flex items-center justify-between border-[#4A6163]/5 hover:border-[#F9A66C]/20 transition-all duration-500 hover:translate-x-2">
                <div className="flex items-center gap-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#4A6163]/5 border border-[#4A6163]/10 flex items-center justify-center font-black font-display text-[#4A6163]/30 group-hover:bg-[#4A6163] group-hover:text-white transition-all duration-500">
                    {(i + 1).toString().padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="text-[#4A6163] text-lg font-black tracking-tight group-hover:text-[#F17A7E] transition-colors uppercase">{m.title}</h3>
                    <p className="text-[10px] text-[#4A6163]/40 font-bold uppercase tracking-widest mt-1">
                      {m.maxPoints} pts • {m.deadline?.toDate?.()?.toLocaleDateString() || 'No Deadline'}
                    </p>
                  </div>
                </div>
                <div className="w-3 h-3 rounded-full bg-[#4A6163]/10 group-hover:bg-[#F9A66C] transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}