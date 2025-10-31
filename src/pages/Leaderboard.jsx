import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Trophy } from 'lucide-react'
import { db } from '../lib/firebase'
import useAuth from '../hooks/useAuth'
import ContributionGrid from '../components/ContributionGrid'
import { fetchLeaderboardData } from '../utils/leaderboard'

function RatingTrend({ data }) {
  if (!data || data.length === 0) return <div className="h-32 flex items-center justify-center text-white/40">No data yet</div>
  const max = Math.max(...data.map((d) => d.rating), 1)
  const min = Math.min(...data.map((d) => d.rating), 0)
  const range = max - min || 1
  const width = 400
  const height = 150

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1 || 1)) * width,
    y: height - ((d.rating - min) / range) * height,
    rating: d.rating,
  }))

  return (
    <div className="relative" style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
        />
        {points.map((p, i) => (
          <g key={i}>
            {i === points.length - 1 && (
              <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#f97316" strokeWidth="2" />
            )}
          </g>
        ))}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-white/40">
        {data.length > 0 && <span>{new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
        {data.length > 0 && <span>{new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
      </div>
    </div>
  )
}

function DistributionChart({ userRating, maxRating = 3000 }) {
  const buckets = 20
  const bucketSize = maxRating / buckets
  const distribution = Array(buckets).fill(0).map(() => Math.floor(Math.random() * 50 + 20))
  const userBucket = Math.floor(userRating / bucketSize)
  const maxCount = Math.max(...distribution, 1)

  return (
    <div className="flex items-end gap-1 h-32">
      {distribution.map((count, i) => {
        const isUserBucket = i === userBucket
        const height = (count / maxCount) * 100
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t ${isUserBucket ? 'bg-orange-500' : 'bg-white/20'}`}
              style={{ height: `${height}%`, minHeight: '4px' }}
            />
          </div>
        )
      })}
    </div>
  )
}

export default function Leaderboard() {
  const { user } = useAuth()
  const [userStats, setUserStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeDays, setActiveDays] = useState(new Set())
  const [topEntries, setTopEntries] = useState([])

  useEffect(() => {
    ;(async () => {
      if (!user) return
      setLoading(true)
      try {
        // Active days for contribution grid
        const loginSnap = await getDocs(collection(db, 'logins', user.uid, 'days'))
        const activeSet = new Set(loginSnap.docs.map((d) => d.id))
        setActiveDays(activeSet)

        // Unified leaderboard among participants
        const lb = await fetchLeaderboardData(user.uid)
        setTopEntries(lb.top || [])

        // User's contest count
        const myScoresSnap = await getDocs(query(collection(db, 'scores'), where('uid', '==', user.uid)))
        const attended = myScoresSnap.size

        const percentile = lb.total > 0 ? (((lb.total - lb.rank) / lb.total) * 100) : 0

        setUserStats({
          rating: lb.points || 0,
          rank: lb.rank,
          total: lb.total,
          attended,
          percentile: percentile.toFixed(1),
          history: [],
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  if (loading) return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>
  if (!userStats) {
    // Create mock active days for demonstration
    const mockActiveDays = new Set()
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      if (i % 3 === 0) { // More consistent pattern - every third day
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        mockActiveDays.add(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`)
      }
    }

    const mockStats = {
      rating: 1626,
      rank: 151888,
      total: 781679,
      attended: 15,
      percentile: 19.8,
      history: [
        { rating: 1200, date: new Date(2025, 3, 1) },
        { rating: 1150, date: new Date(2025, 4, 1) },
        { rating: 1400, date: new Date(2025, 5, 1) },
        { rating: 1500, date: new Date(2025, 6, 1) },
        { rating: 1626, date: new Date(2025, 9, 1) },
      ],
    }
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="space-y-6">
            <div>
              <div className="text-sm text-white/60">Rating</div>
              <div className="text-4xl font-bold mt-1">{mockStats.rating.toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-white/60">Global Ranking</div>
                <div className="text-lg font-semibold mt-1">{mockStats.rank.toLocaleString()} / {mockStats.total.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-white/60">Attended</div>
                <div className="text-lg font-semibold mt-1">{mockStats.attended} contests</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-white/60 mb-2">Rating Trend</div>
              <RatingTrend data={mockStats.history} />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="space-y-6">
            <div>
              <div className="text-sm text-white/60">Top Percentile</div>
              <div className="text-4xl font-bold mt-1">Top {mockStats.percentile}%</div>
            </div>
            <div>
              <div className="text-sm text-white/60 mb-2">Ranking Distribution</div>
              <DistributionChart userRating={mockStats.rating} />
            </div>
            <div>
              <div className="text-sm text-white/60 mb-2">Activity Overview</div>
              <div className="overflow-x-auto">
                <ContributionGrid weeks={52} activeSet={mockActiveDays} />
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4 text-xs text-white/60">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-white/10"></div> Less</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-400"></div> More</div>
                </div>
                <div className="text-sm text-white/60">
                  Total Active Days: <span className="text-white font-semibold">{mockActiveDays.size}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-6">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-yellow-300">
              <Trophy size={18}/> <div className="text-lg font-semibold">Competitive Rating</div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-white/60">Rating</div>
              <div className="text-4xl font-bold mt-1">{userStats.rating.toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-4 bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-sm text-white/60">Ranking</div>
            <div className="text-xl font-semibold mt-1">#{userStats.rank.toLocaleString()}</div>
            <div className="text-xs text-white/50 mt-1">out of {userStats.total.toLocaleString()} users</div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-sm text-white/60">Global Standing</div>
              <div className="text-lg font-semibold mt-1">Top {userStats.percentile}%</div>
            </div>
            <div>
              <div className="text-sm text-white/60">Attended</div>
              <div className="text-lg font-semibold mt-1">{userStats.attended} contests</div>
            </div>
          </div>
          {/* Top Participants */}
          <div>
            <div className="text-sm text-white/60 mb-2">Top Participants</div>
            <div className="divide-y divide-white/10 border border-white/10 rounded-lg overflow-hidden">
              {topEntries.slice(0, 10).map((e, idx) => (
                <div key={e.uid} className="flex items-center justify-between px-3 py-2 bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-white/70">#{idx + 1}</div>
                    <div className="text-white/90">{e.displayName || e.uid.slice(0,8)}</div>
                  </div>
                  <div className="text-white/80 font-semibold">{e.points.toLocaleString()} pts</div>
                </div>
              ))}
              {topEntries.length === 0 && (
                <div className="px-3 py-6 text-center text-white/50">No participants yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="card p-6">
        <div className="space-y-6">
          <div>
            <div className="text-sm text-white/60">Top Percentile</div>
            <div className="text-4xl font-bold mt-1">Top {userStats.percentile}%</div>
          </div>
          <div>
            <div className="text-sm text-white/60 mb-2">Ranking Distribution</div>
            <DistributionChart userRating={userStats.rating} />
          </div>
          <div>
            <div className="text-sm text-white/60 mb-2">Activity Overview</div>
            <ContributionGrid weeks={26} activeSet={activeDays} />
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4 text-xs text-white/60">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-white/10"></div> Less</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-400"></div> More</div>
              </div>
              <div className="text-sm text-white/60">
                Total Active Days: <span className="text-white font-semibold">{activeDays.size}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


