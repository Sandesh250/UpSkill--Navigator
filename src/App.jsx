import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Welcome from './pages/Welcome'
import Auth from './pages/Auth'
import DashboardLayout from './layouts/DashboardLayout'
import Home from './pages/Home'
import Streak from './pages/Streak'
import Chatbot from './pages/Chatbot'
import DoubtSolver from './pages/DoubtSolver'
import Quiz from './pages/Quiz'
import Leaderboard from './pages/Leaderboard'
import Roadmap from './pages/Roadmap'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="streak" element={<Streak />} />
          <Route path="chatbot" element={<Chatbot />} />
          <Route path="doubts" element={<DoubtSolver />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="roadmap" element={<Roadmap />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}


