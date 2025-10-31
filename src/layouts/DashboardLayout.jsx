import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Home, Flame, Bot, HelpCircle, ListChecks, Trophy, Map } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'

const nav = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/streak', label: 'Daily Streak', icon: Flame },
  { to: '/app/chatbot', label: 'AI Chatbot', icon: Bot },
  { to: '/app/doubts', label: 'Doubt Solver', icon: HelpCircle },
  { to: '/app/quiz', label: 'Quiz', icon: ListChecks },
  { to: '/app/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/app/roadmap', label: 'Roadmap', icon: Map },
]

export default function DashboardLayout() {
  const navigate = useNavigate()
  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }
  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr]">
      <aside className="p-4 border-r border-white/10 hidden md:block">
        <div className="text-xl font-semibold mb-6">Upskill Navigator</div>
        <nav className="space-y-1">
          {nav.map((n) => {
            const Icon = n.icon
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 ${isActive ? 'bg-white/10' : ''}`}
              >
                <Icon size={18} /> {n.label}
              </NavLink>
            )
          })}
        </nav>
        <button onClick={handleLogout} className="btn-primary mt-6 w-full justify-center">
          <LogOut size={18} /> Logout
        </button>
      </aside>
      <main className="p-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}


