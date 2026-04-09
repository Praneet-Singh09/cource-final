import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import Navbar from '../../components/Navbar'
import { useNavigate } from 'react-router-dom'

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', instructor: '',
    credits: '', maxCapacity: '', category: ''
  })
  const navigate = useNavigate()

  const fetchCourses = async () => {
    const snap = await getDocs(collection(db, 'courses'))
    setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { fetchCourses() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = {
      ...form,
      credits: Number(form.credits),
      maxCapacity: Number(form.maxCapacity),
      createdAt: new Date()
    }
    await addDoc(collection(db, 'courses'), data)
    setForm({ title: '', description: '', instructor: '', credits: '', maxCapacity: '', category: '' })
    setShowForm(false)
    fetchCourses()
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (confirm('Delete this course?')) {
      await deleteDoc(doc(db, 'courses', id))
      fetchCourses()
    }
  }

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase()) ||
    c.instructor.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#F9FAF4] text-[#4A6163]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 pt-40 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
          <div>
            <h1 className="text-4xl font-black font-display text-[#4A6163] mb-2 uppercase tracking-tight italic">Resource Management</h1>
            <p className="text-[#4A6163]/50 font-medium">Curate and oversee active educational sequences</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className={`btn-primary-glow !h-14 px-8 !text-white !rounded-2xl ${showForm ? '!bg-[#F17A7E]' : '!bg-[#4A6163]'}`}>
            {showForm ? 'Discard Sequence' : '+ Initialize New Course'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="glass-card p-10 mb-12 border-[#4A6163]/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#F9A66C]" />
            <h2 className="text-2xl font-black font-display text-[#4A6163] mb-10 flex items-center gap-4 uppercase italic">
              <span className="w-10 h-10 rounded-xl bg-[#4A6163]/5 text-[#4A6163] flex items-center justify-center text-sm">01</span>
              Configuration Parameters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase tracking-widest">Formal Title</label>
                <input placeholder="Quantum Cryptography and Beyond" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="glass-input w-full bg-white/50" required />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase tracking-widest">Executive Summary</label>
                <textarea placeholder="Outline the core objectives..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="glass-input w-full resize-none bg-white/50" rows={4} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase tracking-widest">Lead Instructor</label>
                <input placeholder="Prof. Elena Rossi" value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })}
                  className="glass-input w-full bg-white/50" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase tracking-widest">Academic Category</label>
                <input placeholder="Cyber-Applied Sciences" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="glass-input w-full bg-white/50" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase tracking-widest">Unit Weightage (Credits)</label>
                <input type="number" placeholder="4" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })}
                  className="glass-input w-full bg-white/50" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase tracking-widest">Enrolment Cap</label>
                <input type="number" placeholder="100" value={form.maxCapacity} onChange={e => setForm({ ...form, maxCapacity: e.target.value })}
                  className="glass-input w-full bg-white/50" required />
              </div>
            </div>
            <div className="flex justify-end mt-12">
              <button type="submit" className="btn-primary-glow !h-14 px-12 !bg-[#4A6163] !text-white">
                Authorize Sequence
              </button>
            </div>
          </form>
        )}

        <div className="mb-12 relative group h-16">
          <input
            type="text"
            placeholder="Search index by title, domain, or lead..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="glass-input w-full pl-16 py-4 h-full !rounded-2xl focus:!border-[#F9A66C]/30 shadow-lg shadow-[#4A6163]/5"
          />
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-[#4A6163]/30 group-focus-within:text-[#F9A66C] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
             <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#4A6163]"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card text-center py-32 border-dashed border-[#4A6163]/10 opacity-60">
            <p className="text-[#4A6163]/40 font-black uppercase tracking-widest">
              {search ? 'Index search yielded no results.' : 'Initialize your first sequence to begin.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filtered.map(course => (
              <div key={course.id}
                onClick={() => navigate(`/admin/courses/${course.id}/manage`)}
                className="glass-card p-10 flex flex-col justify-between cursor-pointer border-[#4A6163]/5 group hover:border-[#F9A66C]/30 duration-500 shadow-xl shadow-[#4A6163]/5">
                <div>
                  <div className="flex items-center justify-between gap-4 mb-8">
                    <span className="text-[9px] font-black text-[#F17A7E] border border-[#F17A7E]/20 px-3 py-1.5 rounded-full bg-[#F17A7E]/5 uppercase tracking-widest">
                      {course.category}
                    </span>
                    <button onClick={(e) => handleDelete(e, course.id)}
                      className="text-[#4A6163]/20 hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <h3 className="text-2xl font-black text-[#4A6163] mb-4 group-hover:text-[#F17A7E] transition-colors leading-tight uppercase tracking-tight italic">
                    {course.title}
                  </h3>
                  <p className="text-sm text-[#4A6163]/60 line-clamp-2 mb-8 font-medium italic">
                    {course.description}
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-6 py-6 border-y border-[#4A6163]/5">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-[#4A6163]/30 uppercase mb-1 tracking-widest">Unit Wt.</p>
                      <p className="text-base font-black text-[#4A6163]">{course.credits}</p>
                    </div>
                    <div className="text-center border-x border-[#4A6163]/5">
                      <p className="text-[9px] font-black text-[#4A6163]/30 uppercase mb-1 tracking-widest">Slots</p>
                      <p className="text-base font-black text-[#4A6163]">{course.maxCapacity}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black text-[#4A6163]/30 uppercase mb-1 tracking-widest">Active</p>
                      <p className="text-base font-black text-emerald-600">--</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-[#4A6163]/40 font-black uppercase tracking-widest">Lead: {course.instructor}</p>
                    <span className="text-[10px] font-black text-[#F9A66C] uppercase tracking-widest group-hover:translate-x-2 transition-transform duration-500">
                      Access Records →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}