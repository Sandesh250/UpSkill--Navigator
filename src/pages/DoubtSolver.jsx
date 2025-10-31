import { useEffect, useState } from 'react'
import { collection, addDoc, onSnapshot, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import useAuth from '../hooks/useAuth'

export default function DoubtSolver() {
  const { user } = useAuth()
  const [question, setQuestion] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all | unresolved | resolved

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'doubts', user.uid, 'items'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [user])

  const addQuestion = async () => {
    const q = question.trim()
    if (!q || !user) return
    setQuestion('')
    setError('')
    setLoading(true)
    // Create pending item
    const ref = await addDoc(collection(db, 'doubts', user.uid, 'items'), {
      question: q,
      answer: '',
      status: 'pending',
      resolved: false,
      createdAt: new Date(),
      updatedAt: serverTimestamp(),
    })
    try {
      const prompt = `You are a helpful coding mentor. Provide a clear, step-by-step answer with short code examples if helpful. Doubt: ${q}`
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: 'gemini-2.5-flash' }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'AI request failed')
      await updateDoc(doc(db, 'doubts', user.uid, 'items', ref.id), {
        answer: data?.text || '',
        status: 'answered',
        updatedAt: serverTimestamp(),
      })
    } catch (e) {
      setError(e?.message || 'Failed to generate answer')
      await updateDoc(doc(db, 'doubts', user.uid, 'items', ref.id), {
        answer: 'Error generating answer. Please try again.',
        status: 'error',
        updatedAt: serverTimestamp(),
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleResolved = async (id, current) => {
    await updateDoc(doc(db, 'doubts', user.uid, 'items', id), { resolved: !current, updatedAt: serverTimestamp() })
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
        <button onClick={addQuestion} className="btn-primary" disabled={loading || !question.trim()}>{loading ? 'Asking…' : 'Ask'}</button>
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div className="flex gap-2 text-sm">
        {['all','unresolved','resolved'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-lg border ${filter===f ? 'bg-white/10' : 'bg-white/5'} border-white/10`}>{f[0].toUpperCase()+f.slice(1)}</button>
        ))}
      </div>
      <div className="grid gap-3">
        {items.filter((it) => filter==='all' ? true : filter==='resolved' ? it.resolved : !it.resolved).map((it) => (
          <div key={it.id} className="card">
            <div className="font-medium">{it.question}</div>
            <div className="mt-2 text-white/70">{it.status==='pending' ? 'Generating answer…' : it.answer}</div>
            <div className="mt-2 text-xs text-white/50">Status: {it.status || (it.resolved ? 'answered' : 'open')}</div>
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


