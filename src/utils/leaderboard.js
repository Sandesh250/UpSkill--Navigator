import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

function sinceDays(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

export async function fetchLeaderboardData(userId) {
  const usersQ = query(collection(db, 'users'), where('isParticipant', '==', true))
  const usersSnap = await getDocs(usersQ)
  const participants = usersSnap.docs.map((d) => ({
    uid: d.id,
    totalPoints: d.data().totalPoints || 0,
    displayName: d.data().displayName || '',
    photoURL: d.data().photoURL || '',
  }))

  const sevenDaysAgo = sinceDays(7)
  const scoresSnap = await getDocs(collection(db, 'scores'))
  const weekly = new Map()
  scoresSnap.forEach((doc) => {
    const data = doc.data()
    const ts = data.createdAt?.toDate?.() || data.createdAt || null
    if (!ts || ts < sevenDaysAgo) return
    weekly.set(data.uid, (weekly.get(data.uid) || 0) + (data.score || 0))
  })

  const entries = participants.map((p) => ({
    uid: p.uid,
    points: p.totalPoints || 0,
    weeklyPoints: (weekly.get(p.uid) || 0) * 10,
    displayName: p.displayName,
    photoURL: p.photoURL,
  }))
  entries.sort((a, b) => b.points - a.points)

  const total = entries.length
  const index = entries.findIndex((e) => e.uid === userId)
  const rank = index >= 0 ? index + 1 : total + 1
  const points = entries.find((e) => e.uid === userId)?.points || 0
  const weeklyPoints = entries.find((e) => e.uid === userId)?.weeklyPoints || 0

  return {
    rank,
    total,
    points,
    weeklyPoints,
    top: entries.slice(0, 50),
  }
}
