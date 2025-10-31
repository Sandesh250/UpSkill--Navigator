import useAuth from '../hooks/useAuth'
import { useEffect, useState } from 'react'
import { fetchLeaderboardData } from '../utils/leaderboard'
import { Flame, Trophy } from 'lucide-react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import ContributionGrid from '../components/ContributionGrid'

const quotes = [
  'Learning never exhausts the mind. — Leonardo da Vinci',
  'The future depends on what you do today. — Gandhi',
  'Simplicity is the soul of efficiency. — Austin Freeman',
]

export default function Home() {
  const { user } = useAuth()
  const [lb, setLb] = useState({ rank: 0, total: 0, weeklyPoints: 0 })
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Learner'
  const quote = quotes[Math.floor(Math.random() * quotes.length)]

  const stats = {
    points: 0,
    dayStreak: 0,
    best: 0,
    conceptsCompleted: 0,
    conceptsTotal: 45,
    dailyGoal: 60,
    minutesToday: 0,
    totalScreenTime: 8.2, // hours
  }

  // Mock active days for contribution graph (last ~52 weeks = 1 year)
  const activeDays = new Set()
  const today = new Date()
  for (let i = 0; i < 52 * 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    // Simulate activity: sparse in first 4 months, dense in last 8 months
    const monthsAgo = i / 30
    const probability = monthsAgo > 4 ? 0.8 : monthsAgo > 3 ? 0.6 : 0.1
    if (Math.random() < probability) {
      activeDays.add(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`)
    }
  }

  useEffect(() => {
    ;(async () => {
      if (!user) return
      const data = await fetchLeaderboardData(user.uid)
      setLb({ rank: data.rank, total: data.total, weeklyPoints: data.weeklyPoints })
    })()
  }, [user])

  const leaderboard = { rank: lb.rank || 0, total: lb.total || 0, weeklyPoints: lb.weeklyPoints || 0 }
  const subjects = [
    { name: 'Frontend', value: 65, color: '#6d28d9' },
    { name: 'DSA', value: 40, color: '#22c55e' },
    { name: 'AI/ML', value: 25, color: '#38bdf8' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Welcome back, {displayName}</h1>
          <p className="mt-2 text-white/70">Continue your learning journey</p>
        </div>
        <div className="glass px-4 py-3 rounded-xl flex items-center gap-3">
          <div className="text-sm text-white/60">Current Streak</div>
          <div className="flex items-center gap-2 text-orange-300">
            <Flame size={18} />
            <span className="font-semibold">{stats.dayStreak} Days</span>
          </div>
        </div>
      </div>

      {/* Badges row (replaces Today's Challenge) */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[{label:'Minutes Today', value: `${stats.minutesToday}/${stats.dailyGoal}`, color:'bg-blue-500/15 text-blue-300 border-blue-500/30'},
          {label:'Points', value: stats.points, color:'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'},
          {label:'Best Streak', value: stats.best + ' days', color:'bg-amber-500/15 text-amber-300 border-amber-500/30'},
          {label:'Level', value: '1', color:'bg-purple-500/15 text-purple-300 border-purple-500/30'}].map((b) => (
          <div key={b.label} className={`rounded-xl px-4 py-3 border ${b.color} flex items-center justify-between`}>
            <span className="text-sm">{b.label}</span>
            <span className="font-semibold">{b.value}</span>
          </div>
        ))}
      </div>

      {/* Leaderboard and Streak */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Leaderboard Rank */}
        <div className="card p-5">
          <div className="flex items-center gap-2 text-yellow-300"><Trophy size={18}/> <div className="text-lg font-semibold">Weekly Leaderboard</div></div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-white/60">Your Rank</div>
              <div className="text-3xl font-extrabold">#{leaderboard.rank}</div>
              <div className="text-xs text-white/60 mt-1">out of {leaderboard.total}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/60">Weekly Points</div>
              <div className="text-2xl font-bold">{leaderboard.weeklyPoints}</div>
            </div>
          </div>
        </div>

        {/* Current Streak and Contribution Graph */}
        <div className="card p-5">
          <div className="text-lg font-semibold mb-3">Streaks</div>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3 items-start">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="text-sm text-white/60">Current Streak</div>
                <div className="mt-1 flex items-center gap-2 text-orange-300"><Flame size={18}/> <div className="text-2xl font-bold">{stats.dayStreak} Days</div></div>
                <div className="text-xs text-white/50 mt-1">36 days</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[5,10,15,30].map((d) => (
                  <span key={d} className={`px-3 py-1 rounded-full text-xs border ${stats.best >= d ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-white/10 text-white/60 border-white/20'}`}>{d}-day</span>
                ))}
              </div>
            </div>
            {/* Contribution Graph */}
            <div className="mt-4">
              <div className="text-sm text-white/60 mb-2">Activity Overview</div>
              <ContributionGrid activeSet={activeDays} weeks={52} />
              <div className="flex items-center gap-4 mt-3 text-xs text-white/60">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-white/10"></div> Less</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-400"></div> More</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects progress */}
      <div className="card p-5">
        <div className="text-lg font-semibold mb-4">Subjects</div>
        <div className="grid sm:grid-cols-3 gap-4">
          {subjects.map((s) => (
            <div key={s.name} className="bg-white/5 rounded-lg p-4 border border-white/10 flex flex-col items-center justify-center">
              <div className="w-24">
                <CircularProgressbar value={s.value} text={`${s.value}%`} styles={buildStyles({ textColor: '#fff', pathColor: s.color, trailColor: 'rgba(255,255,255,0.1)' })} />
              </div>
              <div className="mt-2 text-sm">{s.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Screen Time Summary */}
      <div className="card p-5">
        <div className="text-lg font-semibold mb-4">Screen Time</div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-sm text-white/60">Total Screen Time</div>
            <div className="mt-2 text-3xl font-bold">{stats.totalScreenTime}h</div>
            <div className="text-xs text-white/50 mt-1">This month</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-sm text-white/60">Today's Goal</div>
            <div className="mt-2 text-3xl font-bold">{stats.dailyGoal} min</div>
            <div className="text-xs text-white/50 mt-1">Completed: {stats.minutesToday} min</div>
          </div>
        </div>
      </div>

      {/* Footer quote */}
      <div className="text-sm text-white/60">{quote}</div>
    </div>
  )
}

function TargetIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
      <path d="M12 8a4 4 0 1 1-4 4 4.005 4.005 0 0 1 4-4m0-6a1 1 0 0 1 1 1v2.07A7.002 7.002 0 0 1 19.93 11H22a1 1 0 0 1 0 2h-2.07A7.002 7.002 0 0 1 13 19.93V22a1 1 0 0 1-2 0v-2.07A7.002 7.002 0 0 1 4.07 13H2a1 1 0 0 1 0-2h2.07A7.002 7.002 0 0 1 11 5.07V3a1 1 0 0 1 1-1m0 6a6 6 0 1 0 6 6 6.006 6.006 0 0 0-6-6"/>
    </svg>
  )
}


