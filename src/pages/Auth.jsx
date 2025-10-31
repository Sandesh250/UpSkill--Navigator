import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { auth, googleProvider } from '../lib/firebase'
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

export default function Auth() {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const afterLogin = () => {
    const from = location.state?.from?.pathname || '/app'
    navigate(from, { replace: true })
  }

  const onGoogle = async () => {
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
      afterLogin()
    } catch (e) {
      setError(e.message)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      afterLogin()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass p-6">
        <h2 className="text-2xl font-semibold text-center">{isSignup ? 'Create account' : 'Welcome back'}</h2>
        {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full px-3 py-2 bg-white/5 rounded-lg outline-none border border-white/10 focus:border-brand-600" />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full px-3 py-2 bg-white/5 rounded-lg outline-none border border-white/10 focus:border-brand-600" />
          </div>
          <button type="submit" className="btn-primary w-full justify-center">{isSignup ? 'Sign Up' : 'Log In'}</button>
        </form>
        <div className="mt-4 text-center text-sm">
          <button className="text-brand-500 hover:underline" onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>
        <div className="mt-6">
          <button onClick={onGoogle} className="w-full justify-center btn-primary bg-white/10 hover:bg-white/20">Continue with Google</button>
        </div>
      </motion.div>
    </div>
  )
}


