import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { Link } from 'react-router-dom'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await setDoc(doc(db, 'users', cred.user.uid), {
        name,
        email,
        role: 'student',
        createdAt: new Date()
      })
    } catch (err) {
      setError('Could not create account. Try a different email.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F9FAF4] text-[#4A6163]">
      <div className="glass-card p-12 w-full max-w-md relative z-10 border-[#4A6163]/5 shadow-2xl bg-white/60">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[#F17A7E]/10 rounded-3xl mx-auto mb-6 flex items-center justify-center">
            <span className="text-3xl">✧</span>
          </div>
          <p className="text-[10px] font-black text-[#F17A7E] uppercase tracking-[0.4em] mb-2">New Sequence Initiation</p>
          <h1 className="text-4xl font-black font-display text-[#4A6163] italic uppercase tracking-tight">
            Join Nexus
          </h1>
        </div>

        {error && (
          <div className="bg-[#F17A7E]/5 border border-[#F17A7E]/20 text-[#F17A7E] p-4 rounded-2xl text-xs mb-8 text-center font-black uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-6" autoComplete="off">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase tracking-widest">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              autoComplete="off"
              className="glass-input w-full bg-white/50" 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase tracking-widest">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              autoComplete="off"
              className="glass-input w-full bg-white/50" 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#4A6163]/40 ml-1 uppercase tracking-widest">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              className="glass-input w-full bg-white/50" 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary-glow w-full mt-4 !h-16 !bg-[#4A6163] !text-white !text-[10px] !font-black !uppercase !tracking-[0.2em] !rounded-2xl"
          >
            {loading ? 'Initializing...' : 'Authorize Enrollment'}
          </button>
        </form>

        <div className="mt-10 pt-10 border-t border-[#4A6163]/5 text-center">
          <p className="text-[10px] font-black text-[#4A6163]/30 uppercase tracking-widest">
            Existing Member? <Link to="/login" className="text-[#F17A7E] hover:text-[#F9A66C] transition-colors ml-2 underline decoration-2 underline-offset-4">Authenticate Direct</Link>
          </p>
        </div>
      </div>
    </div>
  )
}