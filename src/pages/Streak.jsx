import { useEffect, useState } from 'react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import useAuth from '../hooks/useAuth'
import { daysBack, toYmd, calcStreak } from '../utils/dateUtils'
import ContributionGrid from '../components/ContributionGrid'
import { getCalendarAccessToken, fetchCalendarActiveDays } from '../lib/google'

function getDaysBetween(a, b) {
  const ms = 24 * 60 * 60 * 1000
  return Math.floor((new Date(a).setHours(0,0,0,0) - new Date(b).setHours(0,0,0,0)) / ms)
}

export default function Streak() {
  const { user } = useAuth()
  const [streak, setStreak] = useState(0)
  const [lastActive, setLastActive] = useState(null)
  const [activeDays, setActiveDays] = useState(new Set())
  const [loadingCal, setLoadingCal] = useState(false)

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

  // Build 28 weeks grid (196 days)
  const gridDays = daysBack(new Date(), 196)
  const percentage = Math.min((streak % 7) / 7 * 100, 100)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      // Load login days active set
      const loginSnap = await getDocs(collection(db, 'logins', user.uid, 'days'))
      const set = new Set(loginSnap.docs.map((d) => d.id))
      // Merge with current lastActive/streak doc if present
      const sref = doc(db, 'streaks', user.uid)
      const snap = await getDoc(sref)
      if (snap.exists()) {
        const data = snap.data()
        setStreak(data.streak || 0)
        setLastActive(data.lastActive?.toDate?.() || null)
      }
      setActiveDays(set)
    })()
  }, [user])

  const connectCalendar = async () => {
    if (!user) return
    setLoadingCal(true)
    try {
      // Use your OAuth 2.0 Client ID from Google Cloud Console
      const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID
      const token = await getCalendarAccessToken(clientId)
      const since = new Date()
      since.setDate(since.getDate() - 365)
      const calSet = await fetchCalendarActiveDays(token, since, new Date())
      const merged = new Set(activeDays)
      calSet.forEach((d) => merged.add(d))
      setActiveDays(merged)
      // Recompute streak and save
      const newStreak = calcStreak(merged)
      setStreak(newStreak)
      await setDoc(doc(db, 'streaks', user.uid), { streak: newStreak, lastActive: new Date(), updatedAt: serverTimestamp() }, { merge: true })
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingCal(false)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <div className="text-sm text-white/60">Active days</div>
        <div className="mt-2 text-4xl font-bold">{streak}</div>
        <div className="flex gap-2 mt-4">
          <button onClick={markActiveToday} className="btn-primary">Mark Today</button>
          <button onClick={connectCalendar} className="btn-primary bg-white/10 hover:bg-white/20">
            {loadingCal ? 'Connecting…' : 'Connect Google Calendar'}
          </button>
        </div>
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
      <div className="md:col-span-2 card overflow-x-auto">
        <div className="mb-2 text-sm text-white/60">Last 28 weeks</div>
        <ContributionGrid days={gridDays} activeSet={activeDays} />
      </div>
    </div>
  )
}


