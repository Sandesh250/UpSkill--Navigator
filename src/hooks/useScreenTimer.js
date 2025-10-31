import { useEffect, useMemo, useRef, useState } from 'react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { toYmd } from '../utils/dateUtils'

export default function useScreenTimer(userId) {
  const [loaded, setLoaded] = useState(false)
  const [running, setRunning] = useState(false)
  const [totalMs, setTotalMs] = useState(0)
  const lastStartRef = useRef(null)
  const intervalRef = useRef(null)
  const todayId = useMemo(() => toYmd(new Date()), [])

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const ref = doc(db, 'screenTime', userId, 'days', todayId)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const d = snap.data()
        setTotalMs(d.totalMs || 0)
        const wasRunning = !!d.running
        const lastStart = d.lastStart?.toDate?.() || d.lastStart || null
        if (wasRunning && lastStart) {
          lastStartRef.current = lastStart
          setRunning(true)
        }
      }
      setLoaded(true)
    })()
  }, [userId, todayId])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }
    intervalRef.current = setInterval(() => {
      if (lastStartRef.current) {
        const now = Date.now()
        const elapsed = now - lastStartRef.current.getTime()
        setTotalMs((prev) => prev) // keep state; derived time is computed via getter below
      }
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [running])

  const currentMs = (() => {
    if (!running || !lastStartRef.current) return totalMs
    return totalMs + (Date.now() - lastStartRef.current.getTime())
  })()

  const start = async () => {
    if (running || !userId) return
    const now = new Date()
    lastStartRef.current = now
    setRunning(true)
    const ref = doc(db, 'screenTime', userId, 'days', todayId)
    await setDoc(ref, { running: true, lastStart: now, totalMs, updatedAt: serverTimestamp() }, { merge: true })
  }

  const stop = async () => {
    if (!running || !userId) return
    const now = new Date()
    const add = now.getTime() - (lastStartRef.current?.getTime?.() || now.getTime())
    lastStartRef.current = null
    setRunning(false)
    setTotalMs((prev) => prev + Math.max(0, add))
    const ref = doc(db, 'screenTime', userId, 'days', todayId)
    await setDoc(ref, { running: false, lastStart: null, totalMs: (totalMs + Math.max(0, add)), updatedAt: serverTimestamp() }, { merge: true })
  }

  const resetToday = async () => {
    if (!userId) return
    lastStartRef.current = null
    setRunning(false)
    setTotalMs(0)
    const ref = doc(db, 'screenTime', userId, 'days', todayId)
    await setDoc(ref, { running: false, lastStart: null, totalMs: 0, updatedAt: serverTimestamp() }, { merge: true })
  }

  return {
    loaded,
    running,
    ms: currentMs,
    minutes: Math.floor(currentMs / 60000),
    start,
    stop,
    resetToday,
  }
}
