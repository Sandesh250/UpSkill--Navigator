import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export async function addUserPoints(userId, delta) {
  const ref = doc(db, 'users', userId)
  const snap = await getDoc(ref)
  const current = snap.exists() ? (snap.data().totalPoints || 0) : 0
  await setDoc(ref, { totalPoints: current + delta }, { merge: true })
}


