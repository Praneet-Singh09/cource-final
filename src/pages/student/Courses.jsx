import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'

export default function Courses() {
  const { user, userData } = useAuth()
  const [courses, setCourses] = useState([])
  const [myEnrollments, setMyEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetch = async () => {
      const coursesSnap = await getDocs(collection(db, 'courses'))
      setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      const q = query(collection(db, 'enrollments'), where('studentId', '==', user.uid))
      const enrollSnap = await getDocs(q)
      setMyEnrollments(enrollSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    fetch()
  }, [user.uid])

  const getEnrollmentStatus = (courseId) => {
    const e = myEnrollments.find(e => e.courseId === courseId)
    return e ? e.status : null
  }

  const handleEnroll = async (course) => {
    setEnrolling(course.id)
    await addDoc(collection(db, 'enrollments'), {
      studentId: user.uid,
      studentName: userData.name,
      studentEmail: userData.email,
      courseId: course.id,
      courseName: course.title,
      status: 'pending',
      enrolledAt: new Date()
    })
    const q = query(collection(db, 'enrollments'), where('studentId', '==', user.uid))
    const snap = await getDocs(q)
    setMyEnrollments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setEnrolling('')
  }

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase()) ||
    c.instructor.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#F9FAF4] text-[#4A6163]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <p className="text-[10px] font-black text-[#F9A66C] uppercase tracking-[0.3em] mb-2">Academic Portal</p>
            <h1 className="text-4xl font-black font-display text-[#4A6163] italic">Course Catalog</h1>
            <p className="text-sm text-[#4A6163]/50 mt-1 font-medium">Browse and enroll in available courses</p>
          </div>
          <div className="relative group w-full md:w-96">
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="glass-input w-full pl-14 h-14 !rounded-3xl focus:!border-[#F9A66C]/30"
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#4A6163]/40 group-focus-within:text-[#F9A66C] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-[#4A6163] rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-[#4A6163] rounded-full animate-bounce [animation-delay:-.3s]" />
              <div className="w-2 h-2 bg-[#4A6163] rounded-full animate-bounce [animation-delay:-.5s]" />
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card text-center py-32 border border-dashed border-[#4A6163]/10">
            <p className="text-[#4A6163]/40 font-black uppercase tracking-widest text-sm">
              {search ? 'No courses match your search.' : 'No courses currently available.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(course => {
              const status = getEnrollmentStatus(course.id)
              return (
                <div key={course.id} className="glass-card group flex flex-col border-[#4A6163]/5 hover:border-[#F9A66C]/30 hover:scale-[1.02] duration-500 shadow-xl shadow-[#4A6163]/5">
                  <div className="p-10 flex-1">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-[#F17A7E]/10 flex items-center justify-center font-black text-[#F17A7E] text-2xl group-hover:bg-[#F17A7E] group-hover:text-white transition-all duration-500">
                        {course.title.charAt(0)}
                      </div>
                      <span className="text-[9px] font-black text-[#F9A66C] border border-[#F9A66C]/20 px-3 py-1.5 rounded-full bg-[#F9A66C]/5 uppercase tracking-widest">
                        {course.category}
                      </span>
                    </div>
                    
                    <Link to={`/courses/${course.id}`} className="block">
                      <h3 className="text-2xl font-black text-[#4A6163] mb-4 group-hover:text-[#F17A7E] transition-colors leading-tight uppercase tracking-tight">
                        {course.title}
                      </h3>
                    </Link>
                    
                    <p className="text-sm text-[#4A6163]/60 line-clamp-3 mb-8 font-medium leading-relaxed">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center gap-6 mt-auto">
                      <div className="flex flex-col">
                        <p className="text-[9px] font-black text-[#4A6163]/40 uppercase tracking-widest mb-1">Instructor</p>
                        <p className="text-xs font-black text-[#4A6163]">{course.instructor}</p>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[9px] font-black text-[#4A6163]/40 uppercase tracking-widest mb-1">Credits</p>
                        <p className="text-xs font-black text-[#F17A7E]">{course.credits} PT</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 pt-0 mt-auto">
                    {status === 'pending' && (
                      <div className="w-full text-center py-4 text-[10px] font-black text-[#FFC94B] uppercase tracking-widest border border-[#FFC94B]/20 rounded-2xl bg-[#FFC94B]/5">
                        Approval Pending
                      </div>
                    )}
                    {status === 'active' && (
                      <div className="w-full text-center py-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-500/20 rounded-2xl bg-emerald-500/5">
                        Currently Enrolled
                      </div>
                    )}
                    {status === 'dropped' && (
                      <div className="w-full text-center py-4 text-[10px] font-black text-red-500 uppercase tracking-widest border border-red-500/20 rounded-2xl bg-red-500/5">
                        Access Denied
                      </div>
                    )}
                    {status === 'completed' && (
                      <div className="w-full text-center py-4 text-[10px] font-black text-[#4A6163] uppercase tracking-widest border border-[#4A6163]/20 rounded-2xl bg-[#4A6163]/5">
                        Course Completed
                      </div>
                    )}
                    {!status && (
                      <button onClick={() => handleEnroll(course)} disabled={enrolling === course.id}
                        className="btn-primary-glow w-full !h-14 !rounded-2xl !bg-[#4A6163]"
                        style={{ color: '#ffffff', opacity: 1, textShadow: 'none' }}>
                        <span className="text-white relative z-10">{enrolling === course.id ? 'Requesting...' : 'Enroll in Course'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}