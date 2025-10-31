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

export function calcBestStreak(activeSet) {
  // activeSet contains y-m-d strings
  // Build a sorted array of Date objects for days that are active
  const days = Array.from(activeSet).map((s) => new Date(s + 'T00:00:00'))
  days.sort((a, b) => a.getTime() - b.getTime())
  let best = 0
  let curr = 0
  let prev = null
  const oneDay = 24 * 60 * 60 * 1000
  for (const d of days) {
    if (prev && (d.getTime() - prev.getTime()) === oneDay) {
      curr += 1
    } else {
      curr = 1
    }
    if (curr > best) best = curr
    prev = d
  }
  return best
}

