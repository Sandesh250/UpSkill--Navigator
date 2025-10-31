import useAuth from '../hooks/useAuth'

const quotes = [
  'Learning never exhausts the mind. — Leonardo da Vinci',
  'The future depends on what you do today. — Gandhi',
  'Simplicity is the soul of efficiency. — Austin Freeman',
]

export default function Home() {
  const { user } = useAuth()
  const quote = quotes[Math.floor(Math.random() * quotes.length)]
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome, {user?.displayName || user?.email} 👋</h1>
      <div className="card">
        <div className="text-white/70">Motivational quote</div>
        <div className="mt-2 text-lg">{quote}</div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card">Daily Streak: Keep your momentum!</div>
        <div className="card">Quiz: Take a quick challenge</div>
        <div className="card">Roadmap: Track your milestones</div>
      </div>
    </div>
  )
}


