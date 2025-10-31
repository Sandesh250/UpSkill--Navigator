import { useEffect, useState } from 'react'
import questions from '../data/questions.json'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import useAuth from '../hooks/useAuth'
import { addUserPoints } from '../utils/points'

export default function Quiz() {
  const { user } = useAuth()
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

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
      await addDoc(collection(db, 'scores'), { uid: user.uid, score: s, createdAt: new Date() })
      await addUserPoints(user.uid, s * 10)
    }
  }

  useEffect(() => {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
  }, [])

  return (
    <div className="space-y-4">
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
        <div className="card">Your score: {score} / {questions.length}</div>
      )}
    </div>
  )
}


