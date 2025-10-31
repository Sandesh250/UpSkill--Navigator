import { useEffect, useState } from 'react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import useAuth from '../hooks/useAuth'

function getDaysBetween(a, b) {
  const ms = 24 * 60 * 60 * 1000
  return Math.floor((new Date(a).setHours(0,0,0,0) - new Date(b).setHours(0,0,0,0)) / ms)
}

export default function Streak() {
  const { user } = useAuth()
  const [streak, setStreak] = useState(0)
  const [lastActive, setLastActive] = useState(null)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const ref = doc(db, 'streaks', user.uid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const data = snap.data()
        setStreak(data.streak || 0)
        setLastActive(data.lastActive?.toDate?.() || null)
      } else {
        await setDoc(ref, { streak: 0, lastActive: new Date(), updatedAt: serverTimestamp() })
      }
    })()
  }, [user])

  const markActiveToday = async () => {
    if (!user) return
    const today = new Date()
    let nextStreak = streak
    if (!lastActive) nextStreak = 1
    else {
      const gap = getDaysBetween(today, lastActive)
      if (gap === 0) nextStreak = streak // already counted today
      else if (gap === 1) nextStreak = streak + 1
      else nextStreak = 1
    }
    setStreak(nextStreak)
    setLastActive(today)
    await setDoc(doc(db, 'streaks', user.uid), { streak: nextStreak, lastActive: today, updatedAt: serverTimestamp() }, { merge: true })
  }

  const percentage = Math.min((streak % 7) / 7 * 100, 100)

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <div className="text-sm text-white/60">Active days</div>
        <div className="mt-2 text-4xl font-bold">{streak}</div>
        <button onClick={markActiveToday} className="btn-primary mt-4">Mark Today</button>
      </div>
      <div className="card flex items-center justify-center">
        <div className="w-40">
          <CircularProgressbar
            value={percentage}
            text={`${streak}d`}
            styles={buildStyles({
              textColor: '#fff',
              pathColor: '#6d28d9',
              trailColor: 'rgba(255,255,255,0.1)'
            })}
          />
        </div>
      </div>
    </div>
  )
}


