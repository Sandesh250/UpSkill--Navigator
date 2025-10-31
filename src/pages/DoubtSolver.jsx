import { useEffect, useState } from 'react'
import { collection, addDoc, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import useAuth from '../hooks/useAuth'

export default function DoubtSolver() {
  const { user } = useAuth()
  const [question, setQuestion] = useState('')
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(collection(db, 'doubts', user.uid, 'items'), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [user])

  const addQuestion = async () => {
    const q = question.trim()
    if (!q || !user) return
    setQuestion('')
    const simulated = `Potential approach: clarify the requirements, outline the solution, and test incrementally.`
    await addDoc(collection(db, 'doubts', user.uid, 'items'), {
      question: q,
      answer: simulated,
      resolved: false,
      createdAt: new Date(),
    })
  }

  const toggleResolved = async (id, current) => {
    await updateDoc(doc(db, 'doubts', user.uid, 'items', id), { resolved: !current })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
          placeholder="Type your doubt or question"
          className="flex-1 px-3 py-2 bg-white/5 rounded-lg outline-none border border-white/10 focus:border-brand-600"
        />
        <button onClick={addQuestion} className="btn-primary">Ask</button>
      </div>
      <div className="grid gap-3">
        {items.map((it) => (
          <div key={it.id} className="card">
            <div className="font-medium">{it.question}</div>
            <div className="mt-2 text-white/70">{it.answer}</div>
            <button onClick={() => toggleResolved(it.id, it.resolved)} className="btn-primary mt-3">
              {it.resolved ? 'Mark Unresolved' : 'Mark Resolved'}
            </button>
          </div>
        ))}
        {items.length === 0 && <div className="text-white/50">No doubts yet.</div>}
      </div>
    </div>
  )
}


