export default function ContributionGrid({ days, activeSet, weeks }) {
  // Supports two modes:
  // 1) Pass explicit `days: Date[]` (chronological). We'll render by slicing into weeks.
  // 2) Omit `days`. We'll render last `weeks` (default 26) from today.

  const activeDaysCount = activeSet ? activeSet.size : 0
  let columns = []
  if (Array.isArray(days) && days.length > 0) {
    const weekCount = Math.ceil(days.length / 7)
    for (let w = 0; w < weekCount; w++) {
      const col = []
      for (let d = 0; d < 7; d++) {
        const idx = w * 7 + d
        const date = days[idx]
        if (!date) continue
        const iso = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
        const active = activeSet?.has(iso)
        col.push({ iso, active })
      }
      columns.push(col)
    }
  } else {
    const useWeeks = weeks || 26
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - (useWeeks * 7 - 1))
    for (let w = 0; w < useWeeks; w++) {
      const col = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(start)
        date.setDate(start.getDate() + w * 7 + d)
        const iso = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
        const active = activeSet?.has(iso)
        col.push({ iso, active })
      }
      columns.push(col)
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {columns.map((col, i) => (
          <div key={i} className="flex flex-col gap-1">
            {col.map((cell) => (
              <div
                key={cell.iso}
                title={cell.iso}
                className={`w-3 h-3 rounded-sm ${cell.active ? 'bg-emerald-600' : 'bg-white/10'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}


