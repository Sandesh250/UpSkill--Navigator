import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function Welcome() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-brand-500 bg-clip-text text-transparent"
        >
          Upskill Navigator – Your Path to Mastery
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-white/70"
        >
          Track streaks, practice quizzes, ask doubts, and climb the leaderboard.
        </motion.p>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8">
          <Link to="/auth" className="btn-primary text-lg px-6 py-3">Get Started</Link>
        </motion.div>
      </div>
    </div>
  )
}


