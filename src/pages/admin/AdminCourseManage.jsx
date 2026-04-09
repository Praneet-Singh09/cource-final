import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'

export default function AdminCourseManage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editForm, setEditForm] = useState(null)
  const [newModule, setNewModule] = useState({ title: '', maxPoints: '', deadline: '', pointsDescription: [''] })

  const [addingModule, setAddingModule] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [editingModule, setEditingModule] = useState(null)
  const [editModuleForm, setEditModuleForm] = useState(null)
  const [selectedEnrollment, setSelectedEnrollment] = useState(null)
  const [studentPerf, setStudentPerf] = useState([])
  const [gradingScores, setGradingScores] = useState({}) // { moduleId: score }

  const fetchAll = async () => {
    const courseSnap = await getDoc(doc(db, 'courses', id))
    if (courseSnap.exists()) {
      const data = { id: courseSnap.id, ...courseSnap.data() }
      setCourse(data)
      setEditForm({
        title: data.title,
        description: data.description,
        instructor: data.instructor,
        credits: data.credits,
        maxCapacity: data.maxCapacity,
        category: data.category
      })
    }
    const modulesSnap = await getDocs(query(collection(db, 'modules'), where('courseId', '==', id)))
    setModules(modulesSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.orderIndex - b.orderIndex))
    const enrollSnap = await getDocs(query(collection(db, 'enrollments'), where('courseId', '==', id)))
    setEnrollments(enrollSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [id])

  const handleSave = async (e) => {
    e.preventDefault()
    await updateDoc(doc(db, 'courses', id), {
      ...editForm,
      credits: Number(editForm.credits),
      maxCapacity: Number(editForm.maxCapacity)
    })
    fetchAll()
    alert('Course updated!')
  }

  const handleAddModule = async (e) => {
    e.preventDefault()
    if (!newModule.title.trim()) return
    setAddingModule(true)
    const filteredPoints = newModule.pointsDescription.filter(p => p.trim() !== '')
    await addDoc(collection(db, 'modules'), {
      courseId: id,
      title: newModule.title.trim(),
      maxPoints: newModule.maxPoints ? Number(newModule.maxPoints) : null,
      deadline: newModule.deadline ? new Date(newModule.deadline) : null,
      pointsDescription: filteredPoints.length > 0 ? filteredPoints : null,
      orderIndex: modules.length
    })
    setNewModule({ title: '', maxPoints: '', deadline: '', pointsDescription: [''] })
    setAddingModule(false)
    fetchAll()
  }

  const handleDeleteModule = async (moduleId) => {
    if (confirm('Delete this module?')) {
      await deleteDoc(doc(db, 'modules', moduleId))
      if (editingModule === moduleId) {
        setEditingModule(null)
        setEditModuleForm(null)
      }
      fetchAll()
    }
  }

  const startEditModule = (m) => {
    if (editingModule === m.id) {
      setEditingModule(null)
      setEditModuleForm(null)
      return
    }
    setEditingModule(m.id)
    setEditModuleForm({
      title: m.title || '',
      maxPoints: m.maxPoints ?? '',
      deadline: m.deadline ? m.deadline.toDate().toISOString().split('T')[0] : '',
      pointsDescription: Array.isArray(m.pointsDescription) ? (m.pointsDescription.length ? m.pointsDescription : ['']) : m.pointsDescription ? [m.pointsDescription] : ['']
    })
  }

  const handleUpdateModule = async (e) => {
    e.preventDefault()
    if (!editModuleForm || !editingModule) return
    const filteredPoints = editModuleForm.pointsDescription.filter(p => p.trim() !== '')
    await updateDoc(doc(db, 'modules', editingModule), {
      title: editModuleForm.title.trim(),
      maxPoints: editModuleForm.maxPoints ? Number(editModuleForm.maxPoints) : null,
      deadline: editModuleForm.deadline ? new Date(editModuleForm.deadline) : null,
      pointsDescription: filteredPoints.length > 0 ? filteredPoints : null
    })
    setEditingModule(null)
    setEditModuleForm(null)
    fetchAll()
  }

  const fetchStudentPerformance = async (enrollmentId) => {
    const q = query(collection(db, 'performance'), where('enrollmentId', '==', enrollmentId))
    const snap = await getDocs(q)
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    setStudentPerf(data)
    
    const scores = {}
    data.forEach(p => {
      if (p.score !== undefined) scores[p.moduleId] = p.score
    })
    setGradingScores(scores)
  }

  const openGrader = (enrollment) => {
    console.log("Opening grader for:", enrollment.studentName);
    setSelectedEnrollment(enrollment)
    fetchStudentPerformance(enrollment.id)
    setTimeout(() => {
      document.getElementById('grader-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSaveGrade = async (moduleId, maxPoints) => {
    const score = gradingScores[moduleId]
    if (score === undefined || score === '') return
    
    const numericScore = Number(score)
    if (isNaN(numericScore) || numericScore < 0 || (maxPoints && numericScore > maxPoints)) {
      alert(`Please enter a valid score between 0 and ${maxPoints || 'any'}`)
      return
    }

    const existing = studentPerf.find(p => p.moduleId === moduleId)
    const data = {
      score: numericScore,
      maxScore: maxPoints || 100, // Fallback if maxPoints is somehow missing
      updatedAt: new Date()
    }

    if (existing) {
      await updateDoc(doc(db, 'performance', existing.id), data)
    } else {
      // If no performance record exists yet (grading before submission), create a placeholder
      await addDoc(collection(db, 'performance'), {
        ...data,
        enrollmentId: selectedEnrollment.id,
        studentId: selectedEnrollment.studentId,
        courseId: id,
        moduleId: moduleId,
        notes: '',
        submittedAt: null
      })
    }
    fetchStudentPerformance(selectedEnrollment.id)
    alert('Grade saved!')
  }

  const updateEnrollment = async (enrollmentId, status) => {
    await updateDoc(doc(db, 'enrollments', enrollmentId), { status })
    fetchAll()
  }

  const pending = enrollments.filter(e => e.status === 'pending')
  const active = enrollments.filter(e => e.status === 'active')

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )

  if (!course) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <Navbar />
      <p className="p-6 text-sm text-slate-500">Course not found.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F9FAF4] text-[#4A6163]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 pt-40 pb-20">

        <button onClick={() => navigate('/admin/courses')}
          className="text-[10px] font-black text-[#4A6163]/40 hover:text-[#F9A66C] mb-10 flex items-center gap-2 uppercase tracking-[0.3em] transition-all group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Index
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <div>
            <p className="text-[10px] font-black text-[#F9A66C] uppercase tracking-[0.4em] mb-2 leading-none">Administrative Console</p>
            <h1 className="text-4xl font-black font-display text-[#4A6163] italic uppercase tracking-tight leading-none">{course?.title}</h1>
          </div>
          <div className="flex gap-4">
            <div className="glass px-8 py-6 rounded-3xl border-[#4A6163]/5 bg-white/40 shadow-xl shadow-[#4A6163]/5">
              <p className="text-[9px] font-black text-[#4A6163]/30 uppercase mb-1 tracking-widest text-center">Active Modules</p>
              <p className="text-3xl font-black font-display text-[#4A6163] italic text-center">{modules.length}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-12 bg-[#4A6163]/5 p-2 rounded-[2rem] border border-[#4A6163]/5 max-w-2xl mx-auto">
          {[
            { id: 'enrollments', label: 'Enrollments', icon: '👤' },
            { id: 'modules', label: 'Curriculum', icon: '📚' },
            { id: 'grading', label: 'Evaluation', icon: '📝' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-full text-[10px] font-black transition-all uppercase tracking-[0.15em]
                ${activeTab === tab.id ? 'bg-[#4A6163] text-white shadow-xl shadow-[#4A6163]/20' : 'text-[#4A6163]/40 hover:text-[#4A6163] hover:bg-white/50'}`}>
              <span className="text-sm opacity-60">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'modules' && (
          <div className="flex flex-col gap-10">
            <form onSubmit={handleAddModule} className="glass-card p-10 border-[#4A6163]/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#F17A7E]" />
              <h2 className="text-2xl font-black font-display text-[#4A6163] mb-10 flex items-center gap-4 uppercase italic">
                <span className="w-10 h-10 rounded-xl bg-[#4A6163]/5 text-[#4A6163] flex items-center justify-center text-sm">02</span>
                Initialize Module
              </h2>
              <div className="flex flex-col gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase tracking-widest">Module Title</label>
                  <input
                    placeholder="E.g., Quantum Entanglement Basics"
                    value={newModule.title}
                    onChange={e => setNewModule({ ...newModule, title: e.target.value })}
                    className="glass-input w-full bg-white/50"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase tracking-widest">Max Score Capacity</label>
                    <input
                      type="number"
                      placeholder="E.g., 100"
                      value={newModule.maxPoints}
                      onChange={e => setNewModule({ ...newModule, maxPoints: e.target.value })}
                      className="glass-input w-full bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase tracking-widest">Submission Cutoff Date</label>
                    <input
                      type="date"
                      value={newModule.deadline}
                      onChange={e => setNewModule({ ...newModule, deadline: e.target.value })}
                      className="glass-input w-full bg-white/50"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase tracking-widest">Reporting Directives <span className="text-[9px] opacity-60">(Visible to Scholars)</span></label>
                  <div className="space-y-2">
                    {newModule.pointsDescription.map((point, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          placeholder="Specify a requirement..."
                          value={point}
                          onChange={e => {
                            const newPoints = [...newModule.pointsDescription]
                            newPoints[index] = e.target.value
                            setNewModule({ ...newModule, pointsDescription: newPoints })
                          }}
                          className="glass-input w-full bg-white/50"
                        />
                        <button type="button" onClick={() => {
                          const newPoints = newModule.pointsDescription.filter((_, i) => i !== index)
                          setNewModule({ ...newModule, pointsDescription: newPoints.length ? newPoints : [''] })
                        }} className="w-12 flex items-center justify-center rounded-2xl bg-[#F17A7E]/5 text-[#F17A7E] hover:bg-[#F17A7E]/10 border border-[#F17A7E]/10 transition-colors">×</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setNewModule({ ...newModule, pointsDescription: [...newModule.pointsDescription, ''] })} 
                    className="btn-ghost !h-10 !px-4 !text-[10px] !py-0 w-fit">
                    + Add Directive
                  </button>
                </div>
              </div>
              <div className="mt-12 flex justify-end">
                <button type="submit" disabled={addingModule}
                  className="btn-primary-glow !h-14 px-12 !bg-[#4A6163] !text-white">
                  {addingModule ? 'Authorizing...' : '+ Commit Module'}
                </button>
              </div>
            </form>

            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-6 mb-2">
                <h3 className="text-sm font-black text-[#4A6163]/30 uppercase tracking-[0.4em] whitespace-nowrap ml-1">Curriculum Breakdown</h3>
                <div className="flex-1 h-px bg-[#4A6163]/10" />
              </div>
              
              {modules.map((m, i) => (
                <div key={m.id} className="glass-card overflow-hidden border-[#4A6163]/5 group shadow-xl shadow-[#4A6163]/5">
                  <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-8 flex-1">
                      <span className="text-4xl font-black font-display text-[#4A6163]/10 tabular-nums italic">{(i + 1).toString().padStart(2, '0')}</span>
                      <div>
                        <h3 className="text-xl font-black text-[#4A6163] group-hover:text-[#F17A7E] transition-colors uppercase tracking-tight italic">
                          {m.title}
                        </h3>
                        <div className="flex gap-6 mt-2">
                          <span className="text-[9px] font-black text-[#4A6163]/30 uppercase tracking-widest">
                            {m.maxPoints ? `${m.maxPoints} Weightage` : 'Ungraded'}
                          </span>
                          <span className="text-[9px] font-black text-[#4A6163]/30 uppercase border-l border-[#4A6163]/10 pl-6 tracking-widest">
                            {m.deadline ? `Cutoff: ${m.deadline.toDate().toLocaleDateString()}` : 'Indefinite'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => startEditModule(m)}
                        className={`!h-12 px-6 !text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border
                          ${editingModule === m.id ? 'bg-[#F9A66C] text-white border-[#F9A66C]' : 'bg-[#4A6163]/5 text-[#4A6163] border-[#4A6163]/10 hover:bg-[#4A6163]/10'}`}>
                        {editingModule === m.id ? 'Discard' : 'Adjust'}
                      </button>
                      <button onClick={() => handleDeleteModule(m.id)}
                        className="!h-12 px-6 !text-[10px] font-black uppercase tracking-widest rounded-xl text-[#F17A7E] bg-[#F17A7E]/5 border border-[#F17A7E]/10 hover:bg-[#F17A7E]/10 transition-colors">
                        Purge
                      </button>
                    </div>
                  </div>

                  {m.pointsDescription && editingModule !== m.id && (
                    <div className="px-8 pb-8 pt-0 ml-16">
                      <div className="bg-white/40 border border-[#4A6163]/5 p-6 rounded-2xl">
                        <p className="text-[9px] font-black text-[#F9A66C] uppercase mb-4 tracking-widest">Grading Matrix</p>
                        <ul className="list-disc list-outside ml-4 space-y-2 text-sm text-[#4A6163]/70 font-medium italic">
                          {(Array.isArray(m.pointsDescription) ? m.pointsDescription : [m.pointsDescription]).map((p, idx) => (
                            <li key={idx} className="pl-1 marker:text-[#F9A66C]">{p}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {editingModule === m.id && editModuleForm && (
                    <form onSubmit={handleUpdateModule} className="p-10 bg-[#4A6163]/[0.02] border-t border-[#4A6163]/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase">Revised Title</label>
                          <input
                            value={editModuleForm.title}
                            onChange={e => setEditModuleForm({ ...editModuleForm, title: e.target.value })}
                            className="glass-input w-full bg-white/50"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase">Score Threshold</label>
                          <input
                            type="number"
                            value={editModuleForm.maxPoints}
                            onChange={e => setEditModuleForm({ ...editModuleForm, maxPoints: e.target.value })}
                            className="glass-input w-full bg-white/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase">New Cutoff</label>
                          <input
                            type="date"
                            value={editModuleForm.deadline}
                            onChange={e => setEditModuleForm({ ...editModuleForm, deadline: e.target.value })}
                            className="glass-input w-full bg-white/50"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-4">
                          <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase">Modified Directives</label>
                          <div className="space-y-2">
                            {editModuleForm.pointsDescription.map((point, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  placeholder="Specify a requirement..."
                                  value={point}
                                  onChange={e => {
                                    const newPoints = [...editModuleForm.pointsDescription]
                                    newPoints[index] = e.target.value
                                    setEditModuleForm({ ...editModuleForm, pointsDescription: newPoints })
                                  }}
                                  className="glass-input w-full bg-white/50"
                                />
                                <button type="button" onClick={() => {
                                  const newPoints = editModuleForm.pointsDescription.filter((_, i) => i !== index)
                                  setEditModuleForm({ ...editModuleForm, pointsDescription: newPoints.length ? newPoints : [''] })
                                }} className="w-12 flex items-center justify-center rounded-2xl bg-[#F17A7E]/5 text-[#F17A7E] hover:bg-[#F17A7E]/10 border border-[#F17A7E]/10 transition-colors">×</button>
                              </div>
                            ))}
                          </div>
                          <button type="button" onClick={() => setEditModuleForm({ ...editModuleForm, pointsDescription: [...editModuleForm.pointsDescription, ''] })} 
                            className="btn-ghost !h-10 !px-4 !text-[10px] !py-0 w-fit">
                            + Add Directive
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-end gap-4 mt-10">
                        <button type="submit" className="btn-primary-glow !h-14 px-10 !text-[10px] !text-white !bg-[#4A6163]">
                          Commit Adjustments
                        </button>
                        <button type="button" onClick={() => { setEditingModule(null); setEditModuleForm(null) }}
                          className="btn-ghost !h-14 px-10 !text-[10px] !border-[#4A6163]/10">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'enrollments' && (
          <div className="flex flex-col gap-12">
            {pending.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-6 mb-2">
                  <h3 className="text-sm font-black text-[#F17A7E] uppercase tracking-[0.4em] whitespace-nowrap ml-1">Pending Authorization</h3>
                  <div className="flex-1 h-px bg-[#F17A7E]/20" />
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {pending.map(e => (
                    <div key={e.id} className={`glass-card flex flex-col md:flex-row items-center justify-between border-[#4A6163]/5 shadow-2xl transition-all duration-500 ${selectedEnrollment?.id === e.id ? 'border-[#F9A66C]/40 ring-1 ring-[#F9A66C]/20 bg-[#F9A66C]/5' : 'bg-white/40'}`}>
                      <button onClick={() => openGrader(e)}
                        className="flex-1 p-8 text-left outline-none group w-full">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-[#F17A7E]/5 text-[#F17A7E] flex items-center justify-center font-black text-xl shadow-inner italic">
                            {e.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className={`text-xl font-black transition-colors uppercase tracking-tight italic ${selectedEnrollment?.id === e.id ? 'text-[#F17A7E]' : 'text-[#4A6163]'}`}>
                              {e.studentName}
                            </p>
                            <p className="text-[10px] font-black text-[#4A6163]/40 tracking-widest uppercase">{e.studentEmail}</p>
                          </div>
                        </div>
                      </button>
                      <div className="flex gap-4 p-8 pt-0 md:pt-8 w-full md:w-auto">
                        <button onClick={() => updateEnrollment(e.id, 'active')}
                          className="btn-primary-glow !h-12 !bg-emerald-600 !rounded-xl !px-8 !text-[10px] !font-black !uppercase !tracking-widest">
                          Authorize
                        </button>
                        <button onClick={() => updateEnrollment(e.id, 'dropped')}
                          className="btn-ghost !h-12 !rounded-xl !px-8 !text-[10px] !font-black !uppercase !tracking-widest border-[#F17A7E]/20 text-[#F17A7E] hover:bg-[#F17A7E]/5">
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {pending.length === 0 && (
              <div className="glass-card text-center py-32 border-dashed border-[#4A6163]/10 opacity-60">
                <p className="text-[#4A6163]/40 font-black uppercase tracking-widest">No pending authorization requests.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'grading' && (
          <div className="flex flex-col gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-6 mb-2">
                <h3 className="text-sm font-black text-[#4A6163]/30 uppercase tracking-[0.4em] whitespace-nowrap ml-1">Authorized Scholars</h3>
                <div className="flex-1 h-px bg-[#4A6163]/10" />
              </div>
              {active.length === 0 ? (
                <div className="glass-card text-center py-32 border-dashed border-[#4A6163]/10 opacity-60">
                  <p className="text-[#4A6163]/40 font-black uppercase tracking-widest">No active sequences detected.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {active.map(e => (
                    <div key={e.id} className={`glass-card flex flex-col md:flex-row items-center justify-between border-[#4A6163]/5 shadow-xl shadow-[#4A6163]/5 transition-all duration-500 ${selectedEnrollment?.id === e.id ? 'border-[#F9A66C]/40 ring-1 ring-[#F9A66C]/20 bg-[#F9A66C]/5' : 'bg-white/40 hover:border-[#4A6163]/10'}`}>
                      <button onClick={() => openGrader(e)}
                        className="flex-1 p-8 text-left outline-none group w-full">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-[#4A6163]/5 text-[#4A6163] flex items-center justify-center font-black text-xl shadow-inner italic">
                            {e.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className={`text-xl font-black transition-colors uppercase tracking-tight italic ${selectedEnrollment?.id === e.id ? 'text-[#F9A66C]' : 'text-[#4A6163]'}`}>
                              {e.studentName}
                            </p>
                            <p className="text-[10px] font-black text-[#4A6163]/40 tracking-widest uppercase">{e.studentEmail}</p>
                          </div>
                        </div>
                      </button>
                      <div className="flex gap-4 p-8 pt-0 md:pt-8 w-full md:w-auto">
                        <button onClick={() => updateEnrollment(e.id, 'completed')}
                          className="btn-ghost !h-12 !rounded-xl !px-8 !text-[10px] !font-black !uppercase !tracking-widest border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5">
                          Finalize Sequence
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedEnrollment && (
              <div id="grader-section" className="glass-card p-12 mt-12 border-[#F9A66C]/30 shadow-2xl relative overflow-hidden bg-white/60">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F9A66C]/5 rounded-bl-[100%] -mr-16 -mt-16" />
                <div className="flex items-center justify-between mb-12 border-b border-[#4A6163]/10 pb-10">
                  <div>
                    <p className="text-[10px] font-black text-[#F9A66C] uppercase tracking-[0.4em] mb-2">Performance Assessment</p>
                    <h2 className="text-4xl font-black font-display text-[#4A6163] italic uppercase tracking-tight">
                      {selectedEnrollment.studentName}
                    </h2>
                  </div>
                  <button onClick={() => setSelectedEnrollment(null)}
                    className="w-12 h-12 rounded-2xl bg-[#4A6163]/5 flex items-center justify-center text-2xl text-[#4A6163]/40 hover:bg-[#F17A7E]/10 hover:text-[#F17A7E] transition-all duration-300">
                    ×
                  </button>
                </div>

                <div className="flex flex-col gap-8">
                  {modules.map((m, i) => {
                    const perf = studentPerf.find(p => p.moduleId === m.id)
                    const score = gradingScores[m.id] ?? ''

                    return (
                      <div key={m.id} className="glass-card border-[#4A6163]/5 rounded-3xl overflow-hidden bg-white/40 shadow-lg shadow-[#4A6163]/5 group">
                        <div className="flex flex-col lg:flex-row items-stretch">
                          <div className="flex-1 p-10">
                            <div className="flex items-center gap-6 mb-6">
                              <span className="text-[10px] font-black text-[#4A6163]/30 tabular-nums uppercase tracking-widest italic">MTX {(i + 1).toString().padStart(2, '0')}</span>
                              <h3 className="text-xl font-black text-[#4A6163] uppercase tracking-tight italic group-hover:text-[#F9A66C] transition-colors leading-none">
                                {m.title}
                              </h3>
                            </div>
                            
                            {perf?.notes ? (
                              <div className="bg-white/60 border border-[#4A6163]/5 p-8 rounded-3xl shadow-inner">
                                <p className="text-[9px] font-black text-[#F9A66C] uppercase mb-4 tracking-widest">Scholar's Annotations</p>
                                <p className="text-sm text-[#4A6163]/70 whitespace-pre-wrap leading-relaxed italic font-medium">
                                  {perf.notes}
                                </p>
                              </div>
                            ) : (
                              <div className="bg-[#4A6163]/[0.02] border border-dashed border-[#4A6163]/10 p-8 rounded-3xl text-center">
                                <p className="text-[10px] text-[#4A6163]/30 font-black uppercase tracking-widest">Awaiting scholar transmission</p>
                              </div>
                            )}
                          </div>

                          <div className="lg:w-80 bg-white/20 border-l border-[#4A6163]/5 p-10 flex flex-col justify-center items-center shadow-lg">
                            <label className="text-[10px] font-black text-[#4A6163]/30 uppercase mb-4 tracking-widest">Assign Weightage</label>
                            <div className="flex flex-col gap-4 w-full">
                              <div className="relative h-16">
                                <input
                                  type="number"
                                  value={score}
                                  onChange={e => setGradingScores({ ...gradingScores, [m.id]: e.target.value })}
                                  className="glass-input w-full text-center text-2xl font-black h-full pr-12 focus:!border-[#F9A66C]/30 bg-white shadow-inner"
                                  placeholder="00"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#4A6163]/20 uppercase">
                                  / {m.maxPoints || 100}
                                </span>
                              </div>
                              <button
                                onClick={() => handleSaveGrade(m.id, m.maxPoints)}
                                className="btn-primary-glow !h-14 w-full !bg-[#4A6163] !text-white !text-[10px] !font-black !uppercase !tracking-[0.2em] !rounded-2xl shadow-xl shadow-[#4A6163]/10"
                              >
                                Commit Grade
                              </button>
                            </div>
                            {perf?.score !== undefined && (
                              <div className="mt-6 flex flex-col items-center">
                                <p className="text-[9px] text-[#4A6163]/20 font-black uppercase tracking-widest mb-1">Active Record</p>
                                <p className="text-3xl font-black text-emerald-600 font-display italic leading-none">{perf.score}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}