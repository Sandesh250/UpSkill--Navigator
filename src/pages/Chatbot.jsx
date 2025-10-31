import { useEffect, useState, useRef } from 'react'
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import useAuth from '../hooks/useAuth'
// No backend dependency in this simplified version

export default function Chatbot() {
  const { user } = useAuth()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const messagesEndRef = useRef(null)
  const [isSending, setIsSending] = useState(false)

  function getSimulatedReply(userText, lastAssistant) {
    const keywords = (userText.match(/\b[a-zA-Z]{4,}\b/g) || []).slice(0, 3)
    const templates = [
      (t) => `Try breaking it down: ${t}. Start with a tiny test case and expand.`,
      (t) => `Focus on one concept at a time: ${t}. Outline steps, then implement.`,
      (t) => `Great question about ${t}. Write pseudocode, then code incrementally.`,
      (t) => `Think inputs→transformations→outputs for ${t}. Validate each step.`,
      (t) => `For ${t}, list constraints, pick a strategy, then measure complexity.`,
      (t) => `Sketch examples for ${t}. Look for patterns, then generalize.`,
    ]
    const topic = keywords.length ? keywords.join(', ') : userText.slice(0, 60)
    let reply = ''
    for (let i = 0; i < 3; i++) {
      const tpl = templates[Math.floor(Math.random() * templates.length)]
      reply = tpl(topic)
      if (!lastAssistant || reply !== lastAssistant) break
    }
    const tails = [' 🔍', ' ✅', ' ✍️', ' 🚀', ' 💡']
    reply += tails[Math.floor(Math.random() * tails.length)]
    return reply
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'chats', user.uid, 'messages'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [user])

  const sendMessage = async () => {
    const content = input.trim()
    if (!content || !user || isSending) return
    setInput('')
    await addDoc(collection(db, 'chats', user.uid, 'messages'), {
      role: 'user',
      content,
      createdAt: new Date(),
    })
    setIsSending(true)
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: content, model: 'gemini-2.5-flash' }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Request failed')
      const reply = data?.text || ''
      await addDoc(collection(db, 'chats', user.uid, 'messages'), {
        role: 'assistant',
        content: reply,
        createdAt: new Date(),
      })
    } catch (e) {
      const lastAssistant = messages.filter((m) => m.role === 'assistant').slice(-1)[0]?.content || ''
      const fallback = getSimulatedReply(content, lastAssistant)
      await addDoc(collection(db, 'chats', user.uid, 'messages'), {
        role: 'assistant',
        content: `Error contacting AI: ${e?.message || 'Unknown error'}. Here's a quick tip instead:\n\n${fallback}`,
        isError: true,
        createdAt: new Date(),
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] grid grid-rows-[1fr_auto] gap-4">
      <div className="card overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-white/50 mt-20">
            <div className="text-5xl mb-3">🎓</div>
            <h3 className="text-lg font-semibold mb-2">Welcome to AI Roadmap Mentor!</h3>
            <p className="text-sm mb-4">Ask about coding, DSA, careers, or any learning path.</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['Learn Python', 'Web Development', 'Machine Learning', 'DSA Roadmap'].map((example) => (
                <button key={example} onClick={() => setInput(example)} className="bg-white/5 hover:bg-white/10 text-white/80 px-3 py-2 rounded-lg text-sm border border-white/10 transition">{example}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`${m.role === 'user' ? 'ml-auto' : ''} ${m.role === 'user' ? 'max-w-[80%]' : 'max-w-full'}`}>
            <div className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-white/10 ml-auto' : m.isError ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5'}`}>
              <div className="text-xs text-white/60 mb-1">{m.role}</div>
              <div className="text-white/90">{m.content}</div>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="max-w-full">
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs text-white/60 mb-1">assistant</div>
              <div className="text-white/90 animate-pulse">Typing…</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask anything about coding, DSA, or careers"
          className="flex-1 px-3 py-2 bg-white/5 rounded-lg outline-none border border-white/10 focus:border-brand-600 text-white placeholder:text-white/50"
          disabled={isSending}
        />
        <button onClick={sendMessage} className="btn-primary" disabled={!input.trim() || isSending}>{isSending ? 'Sending…' : 'Send'}</button>
      </div>
    </div>
  )
}
