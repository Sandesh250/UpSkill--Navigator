export default async function handler(req, res) {
  try {
    // Basic CORS for browser POST from same origin
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') return res.status(204).end()

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing GOOGLE_API_KEY in Vercel env' })
    }

    // Read JSON body safely (Vercel Node serverless doesn't auto-parse)
    let body = {}
    try {
      if (req.body && typeof req.body === 'object') {
        body = req.body
      } else {
        const chunks = []
        await new Promise((resolve, reject) => {
          req.on('data', (c) => chunks.push(c))
          req.on('end', resolve)
          req.on('error', reject)
        })
        const raw = Buffer.concat(chunks).toString('utf8')
        body = raw ? JSON.parse(raw) : {}
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' })
    }

    const { prompt = '', generationConfig, model = 'gemini-2.5-flash' } = body || {}
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' })
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`

    const gResp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(generationConfig ? { generationConfig } : {}),
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
    })

    const gData = await gResp.json()
    if (!gResp.ok) {
      return res.status(gResp.status || 500).json({ error: gData?.error?.message || 'Gemini API error', details: gData })
    }

    const text =
      (gData?.candidates?.[0]?.content?.parts || [])
        .map((p) => p?.text || '')
        .join('') || gData?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return res.status(200).json({ text })
  } catch (err) {
    return res.status(500).json({ error: 'Server error', message: String(err) })
  }
}
