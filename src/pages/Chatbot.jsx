import { useEffect, useState } from 'react'
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import useAuth from '../hooks/useAuth'

export default function Chatbot() {
  const { user } = useAuth()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'chats', user.uid, 'messages'), orderBy('createdAt'))
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [user])

  const sendMessage = async () => {
    const content = input.trim()
    if (!content || !user) return
    setInput('')
    await addDoc(collection(db, 'chats', user.uid, 'messages'), {
      role: 'user',
      content,
      createdAt: new Date(),
    })
    // Simulated AI response
    const reply = `Here is a helpful hint: ${content.slice(0, 80)}... Focus on breaking the problem into smaller steps.`
    await addDoc(collection(db, 'chats', user.uid, 'messages'), {
      role: 'assistant',
      content: reply,
      createdAt: new Date(),
    })
  }

  return (
    <div className="h-[calc(100vh-4rem)] grid grid-rows-[1fr_auto] gap-4">
      <div className="card overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-white/10 ml-auto max-w-[80%]' : 'bg-white/5 max-w-[80%]'}`}>
            <div className="text-xs text-white/60 mb-1">{m.role}</div>
            <div>{m.content}</div>
          </div>
        ))}
        {messages.length === 0 && <div className="text-white/50">Start the conversation…</div>}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask anything about coding, DSA, or careers"
          className="flex-1 px-3 py-2 bg-white/5 rounded-lg outline-none border border-white/10 focus:border-brand-600"
        />
        <button onClick={sendMessage} className="btn-primary">Send</button>
      </div>
    </div>
  )
}

