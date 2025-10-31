import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

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
  return children
}


