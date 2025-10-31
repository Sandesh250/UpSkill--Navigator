export function toYmd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function daysBack(fromDate, count) {
  const out = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(fromDate)
    d.setDate(fromDate.getDate() - i)
    out.push(d)
  }
  return out
}

export function calcStreak(activeSet) {
  let s = 0
  const today = new Date()
  for (let i = 0; ; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (activeSet.has(toYmd(d))) s++
    else break
  }
  return s
}

