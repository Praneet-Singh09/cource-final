import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/Navbar'

export default function MyPerformance() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [enrollment, setEnrollment] = useState(null)
  const [modules, setModules] = useState([])
  const [performance, setPerformance] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedModule, setSelectedModule] = useState(null)
  const [submission, setSubmission] = useState({ notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchAll = useCallback(async () => {
    const enrollSnap = await getDoc(doc(db, 'enrollments', id))
    if (!enrollSnap.exists()) return
    const enrollData = { id: enrollSnap.id, ...enrollSnap.data() }
    setEnrollment(enrollData)

    const modulesSnap = await getDocs(
      query(collection(db, 'modules'), where('courseId', '==', enrollData.courseId))
    )
    const mods = modulesSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.orderIndex - b.orderIndex)
    setModules(mods)

    const perfSnap = await getDocs(
      query(collection(db, 'performance'), where('enrollmentId', '==', id))
    )
    setPerformance(perfSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  const getPerf = (moduleId) => performance.find(p => p.moduleId === moduleId)

  const avgScore = () => {
    const scored = performance.filter(p => p.score != null)
    if (scored.length === 0) return null
    const avg = scored.reduce((sum, p) => {
      const m = modules.find(mod => mod.id === p.moduleId)
      const maxP = m?.maxPoints || 100
      return sum + (p.score / maxP) * 100
    }, 0) / scored.length
    return Math.round(avg)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedModule) return
    setSubmitting(true)

    const existing = getPerf(selectedModule.id)
    const data = {
      enrollmentId: id,
      studentId: user.uid,
      courseId: enrollment.courseId,
      moduleId: selectedModule.id,
      notes: submission.notes,
      submittedAt: new Date()
    }

    if (existing) {
      await updateDoc(doc(db, 'performance', existing.id), data)
    } else {
      await addDoc(collection(db, 'performance'), data)
    }
    setSubmitting(false)
    setSelectedModule(null)
    setSubmission({ notes: '' })
    fetchAll()
  }

  // Attachment logic removed per user request

  const isOverdue = (deadline) => {
    if (!deadline) return false
    return new Date() > deadline.toDate()
  }

  const gradeColor = (pct) => {
    if (pct >= 75) return 'text-green-600'
    if (pct >= 50) return 'text-yellow-600'
    return 'text-red-500'
  }

  const gradeBadge = (pct) => {
    const cls = pct >= 75 ? 'bg-green-100 text-green-700' : pct >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{pct}%</span>
  }
  if (loading) return <div className="min-h-screen bg-[#F9FAF4]"><Navbar /><p className="p-6 text-sm text-[#4A6163]/50">Loading...</p></div>

  const avg = avgScore()

  return (
    <div className="min-h-screen bg-[#F9FAF4] text-[#4A6163]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-40 pb-20">

        <button onClick={() => navigate('/dashboard')}
          className="text-[10px] font-black text-[#4A6163]/40 hover:text-[#F9A66C] mb-10 flex items-center gap-2 uppercase tracking-[0.2em] transition-all group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Finalize Session
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="flex-1">
            <p className="text-[10px] font-black text-[#F9A66C] uppercase tracking-[0.3em] mb-2">Performance Tracking</p>
            <h1 className="text-4xl font-black font-display text-[#4A6163] italic leading-[1.1] uppercase tracking-tight">{enrollment?.courseName}</h1>
            <p className="text-sm text-[#4A6163]/50 mt-1 font-medium italic">Review your academic trajectory and milestones</p>
          </div>
          {avg !== null && (
            <div className="glass px-8 py-6 rounded-3xl border-[#4A6163]/5 shadow-xl shadow-[#4A6163]/5 text-right bg-white/40">
              <p className="text-[9px] font-black text-[#4A6163]/40 uppercase mb-1 tracking-widest">Aggregate Grade</p>
              <p className={`text-5xl font-black font-display italic ${avg >= 75 ? 'text-emerald-600' : avg >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                {avg}%
              </p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <div className="glass-card p-8 border-[#4A6163]/5 flex flex-col items-center text-center shadow-xl shadow-[#4A6163]/5">
            <p className="text-[9px] font-black text-[#4A6163]/30 uppercase mb-3 tracking-widest">Total Modules</p>
            <p className="text-4xl font-black font-display text-[#4A6163] italic">{modules.length}</p>
          </div>
          <div className="glass-card p-8 border-[#4A6163]/5 flex flex-col items-center text-center shadow-xl shadow-[#4A6163]/5">
            <p className="text-[9px] font-black text-[#4A6163]/30 uppercase mb-3 tracking-widest">Completed</p>
            <p className="text-4xl font-black font-display text-emerald-600 italic">{performance.length}</p>
          </div>
          <div className="glass-card p-8 border-[#4A6163]/5 flex flex-col items-center text-center col-span-2 lg:col-span-1 shadow-xl shadow-[#4A6163]/5">
            <p className="text-[9px] font-black text-[#4A6163]/30 uppercase mb-3 tracking-widest">Pending</p>
            <p className="text-4xl font-black font-display text-[#F17A7E] italic">{modules.length - performance.length}</p>
          </div>
        </div>

        {/* Module list */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-6 mb-4">
            <h2 className="text-sm font-black text-[#4A6163]/30 uppercase tracking-[0.4em] whitespace-nowrap">Academic Benchmarks</h2>
            <div className="flex-1 h-px bg-[#4A6163]/10" />
          </div>
          
          {modules.map((m, i) => {
            const perf = getPerf(m.id)
            const pct = (perf && perf.score != null && m.maxPoints) ? Math.round((perf.score / m.maxPoints) * 100) : null
            const overdue = isOverdue(m.deadline)
            const isSelected = selectedModule?.id === m.id

            return (
              <div key={m.id} className={`glass-card overflow-hidden border-[#4A6163]/5 transition-all duration-500 ${isSelected ? 'border-[#F9A66C]/40 shadow-2xl' : 'hover:border-[#4A6163]/10 shadow-lg shadow-[#4A6163]/5'}`}>
                <div
                  onClick={() => {
                    setSelectedModule(isSelected ? null : m)
                    setSubmission(perf ? { notes: perf.notes || '' } : { notes: '' })
                  }}
                  className="flex flex-col md:flex-row items-center justify-between p-8 cursor-pointer group"
                >
                  <div className="flex items-center gap-8 w-full">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black font-display text-xl transition-all duration-500
                      ${perf ? 'bg-emerald-500/10 text-emerald-600' : 'bg-[#4A6163]/5 text-[#4A6163]/40'}`}>
                      {perf ? '✓' : (i + 1).toString().padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                        <h3 className="text-xl font-black text-[#4A6163] group-hover:text-[#F17A7E] transition-colors uppercase tracking-tight leading-none">{m.title}</h3>
                        {pct !== null ? (
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full border border-current bg-white/5 uppercase tracking-widest ${pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                            Result: {pct}%
                          </span>
                        ) : perf ? (
                          <span className="text-[10px] font-black border border-[#4A6163]/20 bg-[#4A6163]/5 px-3 py-1 rounded-full text-[#4A6163] uppercase tracking-widest whitespace-nowrap">Submitted</span>
                        ) : (
                          <span className="text-[10px] font-black text-[#4A6163]/30 uppercase tracking-widest whitespace-nowrap">Pending Submission</span>
                        )}
                      </div>
                      <div className="flex items-center gap-6">
                        {m.maxPoints && (
                          <span className="text-[9px] font-black text-[#4A6163]/30 uppercase tracking-widest">{m.maxPoints} PT Weightage</span>
                        )}
                        {m.deadline && (
                          <span className={`text-[9px] font-black uppercase tracking-widest ${overdue && !perf ? 'text-[#F17A7E] animate-pulse' : 'text-[#4A6163]/30'}`}>
                            {overdue && !perf ? 'Critical Delay' : `Cutoff: ${m.deadline.toDate().toLocaleDateString()}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 mt-6 md:mt-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-[#4A6163] text-white rotate-180' : 'bg-[#4A6163]/5 text-[#4A6163]/40 group-hover:bg-[#4A6163]/10'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="bg-[#4A6163]/[0.02] border-t border-[#4A6163]/5 p-10">
                    <div className="flex flex-col gap-8">
                      {m.pointsDescription && (
                        <div className="bg-white/40 border border-[#4A6163]/5 p-8 rounded-3xl shadow-sm">
                          <p className="text-[10px] font-black text-[#F9A66C] uppercase mb-4 tracking-[0.2em]">Academic Requirements</p>
                          <ul className="list-disc list-outside ml-4 space-y-2 text-sm text-[#4A6163]/70 font-medium italic leading-relaxed">
                            {(Array.isArray(m.pointsDescription) ? m.pointsDescription : [m.pointsDescription]).map((p, idx) => (
                              <li key={idx} className="pl-1 marker:text-[#F9A66C]">{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-[#4A6163]/40 uppercase tracking-widest ml-1">Submisson Notes</label>
                          <textarea
                            placeholder="Construct your comprehensive response or explanation here..."
                            value={submission.notes}
                            onChange={e => setSubmission({ ...submission, notes: e.target.value })}
                            className="glass-input w-full min-h-[160px] py-6 bg-white/50"
                          />
                        </div>

                        <div className="flex flex-col lg:flex-row gap-4">
                          <button type="submit" disabled={submitting}
                            className="btn-primary-glow flex-1 !h-16 !bg-[#4A6163] !text-white !rounded-2xl">
                            {submitting ? 'Transmitting Data...' : perf ? 'Update Records' : 'Commit Submission'}
                          </button>
                          <button type="button" onClick={() => setSelectedModule(null)}
                            className="btn-ghost px-10 !h-16 !border-[#4A6163]/10 !rounded-2xl">
                            Close Console
                          </button>
                        </div>
                      </form>

                      {perf?.score != null && (
                        <div className="mt-4 pt-10 border-t border-[#4A6163]/10">
                          <div className="flex items-center justify-between bg-white/60 p-8 rounded-3xl border border-[#F9A66C]/20 shadow-lg shadow-[#F9A66C]/5">
                            <div>
                              <p className="text-[10px] font-black text-[#F9A66C] uppercase tracking-[0.2em] mb-2">Faculty Evaluation</p>
                              <p className="text-sm font-black text-[#4A6163]">Official assessment completed for this module.</p>
                            </div>
                            <div className="text-right">
                              <p className="text-5xl font-black font-display italic text-[#4A6163]">{perf.score} <span className="text-xs text-[#4A6163]/30 not-italic uppercase tracking-widest ml-1">/ {m.maxPoints} pts</span></p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {modules.length === 0 && (
          <div className="glass-card text-center py-32 border border-dashed border-[#4A6163]/10 opacity-40">
            <p className="text-[#4A6163]/50 font-black uppercase tracking-widest">Protocol sequence awaiting initialization.</p>
          </div>
        )}
      </div>
    </div>
  )
}