import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { userData } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  const isAdmin = userData?.role === 'admin'

  return (
    <div className="sticky top-0 w-full z-[100] px-6 py-4 bg-[#F9FAF4]/95 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto glass rounded-2xl px-8 py-4 flex items-center justify-between shadow-xl shadow-[#4A6163]/5">
        <Link to={isAdmin ? '/admin/courses' : '/dashboard'} className="font-display font-black text-2xl bg-gradient-to-r from-[#F9A66C] to-[#F17A7E] bg-clip-text text-transparent hover:scale-105 transition-transform duration-500">
          CourseEnroll
        </Link>
        <div className="flex items-center gap-10">
          {isAdmin ? (
            <>
              <Link to="/admin/courses" className="text-sm font-black uppercase tracking-widest text-[#4A6163]/60 hover:text-[#4A6163] transition-colors">Courses</Link>
              <Link to="/admin/students" className="text-sm font-black uppercase tracking-widest text-[#4A6163]/60 hover:text-[#4A6163] transition-colors">Students</Link>
              <Link to="/admin/reports" className="text-sm font-black uppercase tracking-widest text-[#4A6163]/60 hover:text-[#4A6163] transition-colors">Reports</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="text-sm font-black uppercase tracking-widest text-[#4A6163]/60 hover:text-[#4A6163] transition-colors">Dashboard</Link>
              <Link to="/courses" className="text-sm font-black uppercase tracking-widest text-[#4A6163]/60 hover:text-[#4A6163] transition-colors">Catalog</Link>
            </>
          )}
          <button onClick={handleLogout} className="appearance-none outline-none text-sm font-black uppercase tracking-widest text-[#4A6163]/60 hover:text-[#4A6163] transition-colors bg-transparent border-none p-0 m-0">
            LOGOUT
          </button>
        </div>
      </nav>
    </div>
  )
}