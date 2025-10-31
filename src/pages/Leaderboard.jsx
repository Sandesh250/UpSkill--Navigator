import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { motion } from 'framer-motion'

function sevenDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d
}

export default function Leaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const since = sevenDaysAgo()
      // Aggregate quiz scores in last 7 days (score * 10)
      const qs = query(collection(db, 'scores'), where('createdAt', '>=', since))
      const scoreSnap = await getDocs(qs)
      const byUser = new Map()
      scoreSnap.forEach((d) => {
        const { uid, score } = d.data()
        const prev = byUser.get(uid) || 0
        byUser.set(uid, prev + (score || 0) * 10)
      })
      // Pull streaks for users we saw; fallback to fetching all streaks is omitted for simplicity
      // In a demo, quiz activity usually covers active users
      const entries = Array.from(byUser.entries()).map(([uid, points]) => ({ uid, points }))
      // Sort desc and pick top 10
      entries.sort((a, b) => b.points - a.points)
      setRows(entries.slice(0, 10))
      setLoading(false)
    })()
  }, [])

  if (loading) return <div>Loading leaderboard…</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Weekly Leaderboard</h2>
      <div className="glass">
        {rows.length === 0 && <div className="p-4 text-white/60">No entries yet. Take a quiz!</div>}
        {rows.map((r, idx) => (
          <motion.div
            key={r.uid}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-3 px-4 py-3 border-t border-white/10 first:border-t-0"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-yellow-500/20' : idx === 1 ? 'bg-gray-300/20' : idx === 2 ? 'bg-amber-700/20' : 'bg-white/10'}`}>
              {idx + 1}
            </div>
            <div className="flex-1">
              <div className="text-sm text-white/70">User</div>
              <div className="font-medium break-all">{r.uid}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/70">Points</div>
              <div className="font-semibold">{r.points}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}


