import { useEffect, useMemo, useState } from 'react'
import fe from '../data/questions/frontend.json'
import dsa from '../data/questions/dsa.json'
import aiml from '../data/questions/aiml.json'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import useAuth from '../hooks/useAuth'
import { addUserPoints } from '../utils/points'

export default function Quiz() {
  const { user } = useAuth()
  const [subject, setSubject] = useState('frontend')
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  const questions = useMemo(() => {
    if (subject === 'dsa') return dsa
    if (subject === 'aiml') return aiml
    return fe
  }, [subject])

  const onSelect = (qid, idx) => {
    if (submitted) return
    setAnswers((p) => ({ ...p, [qid]: idx }))
  }

  const onSubmit = async () => {
    let s = 0
    for (const q of questions) {
      if (answers[q.id] === q.answer) s += 1
    }
    setScore(s)
    setSubmitted(true)
    if (user) {
      await addDoc(collection(db, 'scores'), { uid: user.uid, score: s, subject, createdAt: new Date() })
      await addUserPoints(user.uid, s * 10)
    }
  }

  useEffect(() => {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
  }, [subject])

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap gap-2 items-center">
        <div className="text-sm text-white/60">Choose subject:</div>
        {[
          { key: 'frontend', label: 'Frontend' },
          { key: 'dsa', label: 'DSA' },
          { key: 'aiml', label: 'AI/ML' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setSubject(s.key)}
            className={`px-3 py-1 rounded-lg border text-sm ${subject === s.key ? 'bg-brand-600 border-brand-600' : 'bg-white/5 border-white/10'}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {questions.map((q) => (
        <div key={q.id} className="card">
          <div className="font-medium">{q.question}</div>
          <div className="mt-3 grid gap-2">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(q.id, idx)}
                className={`px-3 py-2 rounded-lg border ${answers[q.id] === idx ? 'bg-brand-600 border-brand-600' : 'bg-white/5 border-white/10'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      {!submitted ? (
        <button onClick={onSubmit} className="btn-primary">Submit</button>
      ) : (
        <div className="card">Subject: {subject.toUpperCase()} • Your score: {score} / {questions.length}</div>
      )}
    </div>
  )
}


