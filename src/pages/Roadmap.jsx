import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import useAuth from '../hooks/useAuth'

const templates = [
  {
    key: 'frontend',
    title: 'Frontend',
    milestones: ['HTML/CSS', 'JavaScript', 'React', 'State Mgmt', 'Testing']
  },
  {
    key: 'dsa',
    title: 'DSA',
    milestones: ['Arrays', 'Strings', 'Trees', 'Graphs', 'DP']
  },
  {
    key: 'ai',
    title: 'AI',
    milestones: ['Python', 'Numpy/Pandas', 'ML Basics', 'NNs', 'LLMs']
  }
]

export default function Roadmap() {
  const { user } = useAuth()
  const [progress, setProgress] = useState({})
  const [open, setOpen] = useState({})

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const ref = doc(db, 'roadmaps', user.uid)
      const snap = await getDoc(ref)
      if (snap.exists()) setProgress(snap.data())
    })()
  }, [user])

  const toggleMilestone = async (track, idx) => {
    const key = `${track}:${idx}`
    const next = { ...progress, [key]: !progress[key] }
    setProgress(next)
    if (user) await setDoc(doc(db, 'roadmaps', user.uid), next, { merge: true })
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {templates.map((t) => {
        const completed = t.milestones.filter((_, i) => progress[`${t.key}:${i}`]).length
        const pct = Math.round((completed / t.milestones.length) * 100)
        return (
          <div key={t.key} className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/60">{t.title}</div>
                <div className="text-xl font-semibold">{pct}% complete</div>
              </div>
              <button className="btn-primary" onClick={() => setOpen((o) => ({ ...o, [t.key]: !o[t.key] }))}>
                {open[t.key] ? 'Hide' : 'Expand'}
              </button>
            </div>
            {open[t.key] && (
              <div className="mt-4 space-y-2">
                {t.milestones.map((m, i) => {
                  const k = `${t.key}:${i}`
                  const done = !!progress[k]
                  return (
                    <label key={k} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${done ? 'bg-brand-600 border-brand-600' : 'bg-white/5 border-white/10'}`}>
                      <input type="checkbox" checked={done} onChange={() => toggleMilestone(t.key, i)} />
                      <span>{m}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}


