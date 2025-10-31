// Lightweight helpers to obtain an OAuth token and fetch Calendar events

export function loadGoogleScript() {
  return new Promise((resolve) => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) return resolve()
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.onload = resolve
    document.head.appendChild(s)
  })
}

export async function getCalendarAccessToken(clientId) {
  await loadGoogleScript()
  return new Promise((resolve, reject) => {
    if (!clientId) return reject(new Error('Missing VITE_GOOGLE_OAUTH_CLIENT_ID'))
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      callback: (resp) => {
        if (resp && resp.access_token) resolve(resp.access_token)
        else reject(new Error('No access token'))
      },
    })
    tokenClient.requestAccessToken()
  })
}

export async function fetchCalendarActiveDays(accessToken, since, until) {
  const params = new URLSearchParams({
    timeMin: new Date(since).toISOString(),
    timeMax: new Date(until).toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '2500',
  })
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Calendar fetch failed')
  const data = await res.json()
  const set = new Set()
  for (const ev of data.items || []) {
    const start = ev.start?.date || ev.start?.dateTime
    if (!start) continue
    const day = new Date(start)
    const y = day.getFullYear()
    const m = String(day.getMonth() + 1).padStart(2, '0')
    const d = String(day.getDate()).padStart(2, '0')
    set.add(`${y}-${m}-${d}`)
  }
  return set
}

