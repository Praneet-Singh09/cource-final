import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError('Invalid email or password.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F9FAF4] text-[#4A6163]">
      <div className="glass-card p-12 w-full max-w-md relative z-10 border-[#4A6163]/5 shadow-2xl bg-white/60">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[#F9A66C]/10 rounded-3xl mx-auto mb-6 flex items-center justify-center">
            <span className="text-3xl">✦</span>
          </div>
          <p className="text-[10px] font-black text-[#F9A66C] uppercase tracking-[0.4em] mb-2">Authenticated Entry</p>
          <h1 className="text-4xl font-black font-display text-[#4A6163] italic uppercase tracking-tight">
            Welcome Back
          </h1>
        </div>

        {error && (
          <div className="bg-[#F17A7E]/5 border border-[#F17A7E]/20 text-[#F17A7E] p-4 rounded-2xl text-xs mb-8 text-center font-black uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-8" autoComplete="off">
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
            {loading ? 'Authorizing...' : 'Login'}
          </button>
        </form>

        <div className="mt-10 pt-10 border-t border-[#4A6163]/5 text-center">
          <p className="text-[10px] font-black text-[#4A6163]/30 uppercase tracking-widest">
            New Academic Member? <Link to="/signup" className="text-[#F9A66C] hover:text-[#F17A7E] transition-colors ml-2 underline decoration-2 underline-offset-4">Register Enrollment</Link>
          </p>
        </div>
      </div>
    </div>
  )
}