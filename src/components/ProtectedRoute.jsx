import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { toYmd } from '../utils/dateUtils'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    )
  }
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }
  // Mark login day (idempotent) when route is protected and user present
  const ymd = toYmd(new Date())
  setDoc(doc(db, 'logins', user.uid, 'days', ymd), { active: true, at: new Date() }, { merge: true }).catch(() => {})
  return children
}


